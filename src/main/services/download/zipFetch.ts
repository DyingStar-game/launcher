import axios from 'axios'
import * as fs from 'fs'
import type { BrowserWindow } from 'electron'
import { DOWNLOAD_PROGRESS, DOWNLOAD_USER_AGENT, HTTP_TIMEOUT_MS } from '../../config/constants'
import type { Env } from '@shared/types/env'
import { getZipUrl } from './zipUrl'
import { sendProgress } from './progress'
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

/**
 * Streams the game ZIP to disk and reports progress to the renderer. A partial download of the
 * same archive left in the folder is resumed with an HTTP range (ADR 0036); `signal` stops the
 * download, leaving what was received on disk.
 */
export async function downloadZip(
  env: Env,
  destPath: string,
  win: BrowserWindow,
  signal: AbortSignal
): Promise<string> {
  sendProgress(win, 0, { key: 'connecting' })

  const url = getZipUrl(env)
  const zipFilePath = partialZipPath(destPath)
  const meta = readDownloadMeta(destPath)
  const onDisk = fileSize(zipFilePath)
  const validator = meta?.etag ?? meta?.lastModified ?? null
  const resumable =
    meta !== null && meta.env === env && meta.url === url && onDisk > 0 && validator !== null

  if (!resumable) deletePartialDownload(destPath)
  if (resumable && meta.total > 0 && onDisk >= meta.total) {
    return checkedZip(zipFilePath, url, destPath)
  }

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
    return downloadZip(env, destPath, win, signal)
  }
  if (response.status !== 200 && !append) {
    response.data.destroy()
    throw new Error(`Download rejected (HTTP ${response.status})\n${url}`)
  }

  let total: number
  let downloaded: number
  if (append) {
    total = meta.total
    downloaded = onDisk
  } else {
    total = Number(response.headers['content-length'] ?? 0)
    downloaded = 0
    const header = (name: string): string | null => {
      const value = response.headers[name]
      return typeof value === 'string' ? value : null
    }
    writeDownloadMeta(destPath, {
      env,
      url,
      etag: header('etag'),
      lastModified: header('last-modified'),
      total
    })
  }

  const writer = fs.createWriteStream(zipFilePath, { flags: append ? 'a' : 'w' })
  const lastReport = { bytes: downloaded, at: 0 }
  reportDownload(win, downloaded, total, lastReport)

  await new Promise<void>((resolve, reject) => {
    const stream = response.data
    let failure: unknown = null
    // The file is closed before settling, so it can be resumed or deleted right away
    const fail = (err: unknown): void => {
      if (failure !== null) return
      failure = err
      stream.destroy()
      writer.end()
    }
    writer.on('close', () => (failure === null ? resolve() : reject(failure)))
    writer.on('error', fail)
    stream.on('error', fail)
    signal.addEventListener('abort', () => fail(signal.reason), { once: true })

    stream.on('data', (chunk: Buffer) => {
      if (failure !== null) return
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
    // A connection dropped mid-way: what was received stays, to be resumed
    stream.on('close', () => {
      if (!ended) fail(new Error(`Download interrupted\n${url}`))
    })
  })

  return checkedZip(zipFilePath, url, destPath)
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
