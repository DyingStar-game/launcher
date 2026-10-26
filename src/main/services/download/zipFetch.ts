import axios from 'axios'
import * as fs from 'fs'
import { setTimeout as delay } from 'timers/promises'
import type { BrowserWindow } from 'electron'
import {
  DOWNLOAD_PROGRESS,
  DOWNLOAD_RECONNECT,
  DOWNLOAD_USER_AGENT,
  HTTP_TIMEOUT_MS
} from '../../config/constants'
import type { Env } from '@shared/types/env'
import { getZipUrl } from './zipUrl'
import { sendProgress } from './progress'
import { DiskFullError, freeBytes } from './disk'
import {
  deletePartialDownload,
  downloadProgress,
  fileSize,
  partialZipPath,
  readDownloadMeta,
  writeDownloadMeta
} from './partial'

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

/** Verifies the downloaded file starts with a ZIP local file header. */
export function assertIsZipFile(filePath: string, sourceUrl: string): void {
  let fd: number
  try {
    fd = fs.openSync(filePath, 'r')
  } catch {
    throw new Error(`Cannot read downloaded file — ${sourceUrl}`)
  }
  try {
    const head = Buffer.alloc(4)
    const read = fs.readSync(fd, head, 0, 4, 0)
    if (read < 4 || !head.subarray(0, 4).equals(ZIP_MAGIC)) {
      throw new Error(
        `Received file is not a ZIP archive (often an HTML error page, e.g. HTTP 404). Check URL: ${sourceUrl}`
      )
    }
  } finally {
    try {
      fs.closeSync(fd)
    } catch {
      /* ignore */
    }
  }
}

/** Parses the start of a `Content-Range: bytes <start>-<end>/<total>` header. */
function rangeStart(header: unknown): number | null {
  const match = typeof header === 'string' ? header.match(/^bytes (\d+)-/) : null
  return match ? Number(match[1]) : null
}

/**
 * Sends download progress, with its byte counts when the size is known, at most every
 * `minIntervalMs` (and always the last bytes).
 */
function reportDownload(
  win: BrowserWindow,
  downloaded: number,
  total: number,
  lastReport: { bytes: number; at: number }
): void {
  const now = Date.now()
  const done = total > 0 && downloaded >= total
  if (!done && now - lastReport.at < DOWNLOAD_PROGRESS.minIntervalMs) return
  lastReport.at = now
  if (total > 0) {
    sendProgress(win, downloadProgress(downloaded, total), {
      key: 'downloading',
      downloaded,
      total
    })
  } else if (downloaded - lastReport.bytes >= DOWNLOAD_PROGRESS.unknownChunkBytes) {
    lastReport.bytes = downloaded
    sendProgress(
      win,
      Math.min(65, 15 + (downloaded / DOWNLOAD_PROGRESS.unknownSizeCapBytes) * 50),
      { key: 'downloadingIndeterminate', downloaded }
    )
  }
}

/** What the download watchdog remembers across the connections of one download (ADR 0039). */
type ConnectionWatch = {
  /** Speed of the connection replaced for slowness, until the next one is measured. */
  replacedRate: number | null
  /** False once a new connection did not help: the player's line is the limit. */
  replaceWhenSlow: boolean
  /** Connections in a row that received nothing (stalled, dropped or refused). */
  stalls: number
}

/** How one connection ended: the archive is complete, or a new connection must resume it. */
type ConnectionOutcome = 'complete' | 'reconnect'

/**
 * Streams the game ZIP to disk and reports progress to the renderer. A partial download of the
 * same archive left in the folder is resumed with an HTTP range (ADR 0036); a connection that
 * stalls or turns slow is replaced by a new one, resuming where it is (ADR 0039); `signal` stops
 * the download, leaving what was received on disk. A disk too full for the rest of the archive
 * throws a `DiskFullError` before writing (ADR 0047).
 */
export async function downloadZip(
  env: Env,
  destPath: string,
  win: BrowserWindow,
  signal: AbortSignal
): Promise<string> {
  sendProgress(win, 0, { key: 'connecting' })
  const watch: ConnectionWatch = { replacedRate: null, replaceWhenSlow: true, stalls: 0 }
  while ((await downloadOnce(env, destPath, win, signal, watch)) === 'reconnect') {
    if (watch.stalls >= DOWNLOAD_RECONNECT.maxStalls) {
      throw new Error(`Download interrupted (no data received)\n${getZipUrl(env)}`)
    }
    // A server that just dropped or refused the connection gets a moment before the next one
    if (watch.stalls > 0)
      await delay(DOWNLOAD_RECONNECT.retryDelayMs * watch.stalls, null, { signal })
  }
  return checkedZip(partialZipPath(destPath), getZipUrl(env), destPath)
}

/** Downloads the archive, or what is missing of it, over one connection. */
async function downloadOnce(
  env: Env,
  destPath: string,
  win: BrowserWindow,
  signal: AbortSignal,
  watch: ConnectionWatch
): Promise<ConnectionOutcome> {
  const url = getZipUrl(env)
  const zipFilePath = partialZipPath(destPath)
  const meta = readDownloadMeta(destPath)
  const onDisk = fileSize(zipFilePath)
  const validator = meta?.etag ?? meta?.lastModified ?? null
  const resumable =
    meta !== null && meta.env === env && meta.url === url && onDisk > 0 && validator !== null

  if (!resumable) deletePartialDownload(destPath)
  if (resumable && meta.total > 0 && onDisk >= meta.total) return 'complete'

  let response: Awaited<ReturnType<typeof axios.get<NodeJS.ReadableStream & { destroy(): void }>>>
  try {
    response = await axios.get<NodeJS.ReadableStream & { destroy(): void }>(url, {
      responseType: 'stream',
      timeout: HTTP_TIMEOUT_MS.download,
      signal,
      headers: {
        'User-Agent': DOWNLOAD_USER_AGENT,
        Accept: 'application/zip, application/octet-stream, */*',
        // If-Range: the server sends the rest only if the archive did not change, else all of it
        ...(resumable ? { Range: `bytes=${onDisk}-`, 'If-Range': validator } : {})
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 416
    })
  } catch (err) {
    if (signal.aborted) throw err
    if (axios.isAxiosError(err)) {
      // No answer (connection refused, reset, timed out): tried again like a stalled connection
      if (!err.response) {
        watch.stalls += 1
        return 'reconnect'
      }
      const code = err.response?.status
      const hint =
        code === 404
          ? ' — archive not found (404). Set VITE_GAME_DOWNLOAD_BASE_* if ZIPs are hosted elsewhere.'
          : ''
      throw new Error(`Download failed${code ? ` (HTTP ${code})` : ''}${hint}\n${url}`)
    }
    throw err
  }

  const append = response.status === 206 && resumable
  if (
    response.status === 416 ||
    (response.status === 206 &&
      (!append || rangeStart(response.headers['content-range']) !== onDisk))
  ) {
    // The part on disk does not match the archive served: start over
    response.data.destroy()
    deletePartialDownload(destPath)
    return 'reconnect'
  }
  if (response.status !== 200 && !append) {
    response.data.destroy()
    throw new Error(`Download rejected (HTTP ${response.status})\n${url}`)
  }

  let total: number
  let downloaded: number
  let canResume: boolean
  if (append) {
    total = meta.total
    downloaded = onDisk
    canResume = true
  } else {
    total = Number(response.headers['content-length'] ?? 0)
    downloaded = 0
    const header = (name: string): string | null => {
      const value = response.headers[name]
      return typeof value === 'string' ? value : null
    }
    const etag = header('etag')
    const lastModified = header('last-modified')
    canResume = (etag ?? lastModified) !== null
    writeDownloadMeta(destPath, { env, url, etag, lastModified, total })
  }

  // What is left to download must fit on the disk (ADR 0047)
  if (total > 0) {
    const missing = total - downloaded
    const available = await freeBytes(destPath)
    if (available < missing) {
      response.data.destroy()
      throw new DiskFullError(missing, available)
    }
  }

  const writer = fs.createWriteStream(zipFilePath, { flags: append ? 'a' : 'w' })
  const lastReport = { bytes: downloaded, at: 0 }
  reportDownload(win, downloaded, total, lastReport)

  return new Promise<ConnectionOutcome>((resolve, reject) => {
    const stream = response.data
    let stopped = false
    let failure: unknown = null
    let outcome: ConnectionOutcome = 'complete'
    const received = downloaded
    // Bytes on disk over time; the first sample is the latest one at least a window old
    const samples = [{ at: Date.now(), bytes: downloaded }]

    const onAbort = (): void => fail(signal.reason)
    const watchdog = setInterval(() => {
      const now = Date.now()
      samples.push({ at: now, bytes: downloaded })
      while (samples.length > 1 && now - samples[1].at >= DOWNLOAD_RECONNECT.windowMs) {
        samples.shift()
      }
      const oldest = samples[0]
      if (now - oldest.at < DOWNLOAD_RECONNECT.windowMs) return
      const rate = ((downloaded - oldest.bytes) * 1000) / (now - oldest.at)
      if (rate === 0) {
        replaceConnection()
        return
      }
      if (watch.replacedRate !== null) {
        // The first measure since a reconnection for slowness: did it help?
        if (rate < watch.replacedRate * DOWNLOAD_RECONNECT.speedUpFactor) {
          watch.replaceWhenSlow = false
        }
        watch.replacedRate = null
        return
      }
      if (rate < DOWNLOAD_RECONNECT.slowBytesPerSecond && watch.replaceWhenSlow && canResume) {
        watch.replacedRate = rate
        replaceConnection()
      }
    }, DOWNLOAD_RECONNECT.checkEveryMs)

    // The file is closed before settling, so it can be resumed or deleted right away
    const stop = (): void => {
      stopped = true
      stream.destroy()
      writer.end()
    }
    const fail = (err: unknown): void => {
      if (stopped) return
      failure = err
      stop()
    }
    /** Closes this connection: the download goes on over a new one, from what is on disk. */
    const replaceConnection = (): void => {
      if (stopped) return
      outcome = 'reconnect'
      stop()
    }
    writer.on('close', () => {
      clearInterval(watchdog)
      signal.removeEventListener('abort', onAbort)
      if (downloaded > received) watch.stalls = 0
      else if (outcome === 'reconnect') watch.stalls += 1
      if (failure === null) resolve(outcome)
      else reject(failure)
    })
    writer.on('error', fail)
    // A connection reset or dropped mid-way: a new one resumes from what was received
    stream.on('error', replaceConnection)
    signal.addEventListener('abort', onAbort, { once: true })

    stream.on('data', (chunk: Buffer) => {
      if (stopped) return
      downloaded += chunk.length
      if (!writer.write(chunk)) {
        stream.pause()
        writer.once('drain', () => stream.resume())
      }
      reportDownload(win, downloaded, total, lastReport)
    })

    let ended = false
    stream.on('end', () => {
      ended = true
      writer.end()
    })
    stream.on('close', () => {
      if (!ended) replaceConnection()
    })
  })
}

/** The downloaded ZIP, checked; a file that is not a ZIP is removed (it cannot be resumed). */
function checkedZip(zipFilePath: string, url: string, destPath: string): string {
  try {
    assertIsZipFile(zipFilePath, url)
  } catch (err) {
    deletePartialDownload(destPath)
    throw err
  }
  return zipFilePath
}
