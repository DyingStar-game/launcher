import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import type { BrowserWindow } from 'electron'
import {
  DOWNLOAD_PROGRESS,
  DOWNLOAD_USER_AGENT,
  GAME_DOWNLOAD_ZIP_NAME,
  HTTP_TIMEOUT_MS
} from '../../config/constants'
import type { Env } from '@shared/types/env'
import { getZipUrl } from './zipUrl'
import { sendProgress } from './progress'

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

/** Streams the game ZIP to disk and reports progress to the renderer. */
export async function downloadZip(env: Env, destPath: string, win: BrowserWindow): Promise<string> {
  sendProgress(win, 0, { key: 'connecting' })

  const url = getZipUrl(env)

  let response: Awaited<ReturnType<typeof axios.get<NodeJS.ReadableStream>>>
  try {
    response = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: 'stream',
      timeout: HTTP_TIMEOUT_MS.download,
      headers: {
        'User-Agent': DOWNLOAD_USER_AGENT,
        Accept: 'application/zip, application/octet-stream, */*'
      },
      validateStatus: (s) => s >= 200 && s < 300
    })
  } catch (err) {
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

  if (response.status !== 200) {
    throw new Error(`Download rejected (HTTP ${response.status})\n${url}`)
  }

  const totalLength = Number(response.headers['content-length'] ?? 0)
  let downloaded = 0
  let lastProgressReport = 0

  const zipFilePath = path.join(destPath, GAME_DOWNLOAD_ZIP_NAME)
  const writer = fs.createWriteStream(zipFilePath)

  await new Promise<void>((resolve, reject) => {
    const stream = response.data
    stream.on('error', reject)
    writer.on('error', reject)
    writer.on('finish', () => resolve())

    stream.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      if (!writer.write(chunk)) {
        stream.pause()
        writer.once('drain', () => stream.resume())
      }
      if (totalLength > 0) {
        sendProgress(win, (downloaded / totalLength) * DOWNLOAD_PROGRESS.zipWeight, {
          key: 'downloading',
          downloaded,
          total: totalLength
        })
      } else if (downloaded - lastProgressReport >= DOWNLOAD_PROGRESS.unknownChunkBytes) {
        lastProgressReport = downloaded
        sendProgress(
          win,
          Math.min(65, 15 + (downloaded / DOWNLOAD_PROGRESS.unknownSizeCapBytes) * 50),
          { key: 'downloadingIndeterminate', downloaded }
        )
      }
    })

    stream.on('end', () => writer.end())
  })

  assertIsZipFile(zipFilePath, url)
  return zipFilePath
}
