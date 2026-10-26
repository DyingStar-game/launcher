import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import * as http from 'http'
import * as os from 'os'
import * as path from 'path'
import type { AddressInfo } from 'net'
import type { BrowserWindow } from 'electron'

vi.mock('./zipUrl', () => ({ getZipUrl: vi.fn() }))
// The watchdog's spans shortened, so a test lasts a fraction of a second (ADR 0039)
vi.mock('../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  DOWNLOAD_RECONNECT: {
    checkEveryMs: 20,
    windowMs: 100,
    slowBytesPerSecond: 50_000,
    speedUpFactor: 2,
    maxStalls: 2,
    retryDelayMs: 10
  }
}))

import { getZipUrl } from './zipUrl'
import { downloadZip } from './zipFetch'
import { partialZipPath } from './partial'

const ETAG = '"v1"'
// Starts like a ZIP, which is all the download checks
const ARCHIVE = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(8188, 7)])

/**
 * How the server sends a response body: all of it, slowly, a part then nothing, a part then a
 * dropped connection, or nothing.
 */
type Delivery = 'fast' | 'slow' | 'stall' | 'drop' | 'silent'

let deliveries: Delivery[]
let ranges: (string | undefined)[]
let server: http.Server
let destPath: string
const win = {
  isDestroyed: () => false,
  webContents: { send: vi.fn() }
} as unknown as BrowserWindow

beforeEach(async () => {
  ranges = []
  destPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-zip-'))
  server = http.createServer((req, res) => {
    ranges.push(req.headers.range)
    const delivery = deliveries[Math.min(ranges.length, deliveries.length) - 1]
    const range = req.headers.range?.match(/^bytes=(\d+)-$/)
    const start = range && req.headers['if-range'] === ETAG ? Number(range[1]) : 0
    const body = ARCHIVE.subarray(start)
    const headers = { ETag: ETAG, 'Content-Length': String(body.length) }
    if (start > 0) {
      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${ARCHIVE.length - 1}/${ARCHIVE.length}`
      })
    } else {
      res.writeHead(200, headers)
    }
    if (delivery === 'fast') {
      res.end(body)
    } else if (delivery === 'slow') {
      // About 10 KB/s, under the slowness threshold, in small parts: a measuring window sees
      // about ten, so a busy machine does not make one connection look twice as fast as another
      let offset = 0
      const timer = setInterval(() => {
        if (res.destroyed) return clearInterval(timer)
        res.write(body.subarray(offset, offset + 128))
        offset += 128
        if (offset >= body.length) {
          clearInterval(timer)
          res.end()
        }
      }, 12)
    } else if (delivery === 'stall') {
      res.write(body.subarray(0, 2048))
    } else if (delivery === 'drop') {
      res.write(body.subarray(0, 2048))
      setTimeout(() => res.destroy(), 20)
    } else {
      res.flushHeaders()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  vi.mocked(getZipUrl).mockReturnValue(`http://127.0.0.1:${port}/game.zip`)
})

afterEach(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
  fs.rmSync(destPath, { recursive: true, force: true })
  vi.clearAllMocks()
})

/** Downloads the archive with a signal nobody aborts. */
const download = (): Promise<string> =>
  downloadZip('universe-testing', destPath, win, new AbortController().signal)

describe('downloadZip connection watchdog', () => {
  it('replaces a stalled connection, resuming where it stopped', async () => {
    deliveries = ['stall', 'fast']
    const zip = await download()
    expect(ranges).toEqual([undefined, 'bytes=2048-'])
    expect(fs.readFileSync(zip).equals(ARCHIVE)).toBe(true)
  })

  it('resumes over a new connection when the server drops it', async () => {
    deliveries = ['drop', 'fast']
    const zip = await download()
    expect(ranges).toEqual([undefined, 'bytes=2048-'])
    expect(fs.readFileSync(zip).equals(ARCHIVE)).toBe(true)
  })

  it('tries again when the server cannot be reached', async () => {
    const { port } = server.address() as AddressInfo
    await new Promise((resolve) => server.close(resolve))
    deliveries = ['fast']
    // Back after the first attempt is refused
    setTimeout(() => server.listen(port, '127.0.0.1'), 5)
    const zip = await download()
    expect(fs.readFileSync(zip).equals(ARCHIVE)).toBe(true)
  })

  it('replaces a slow connection by a faster one', async () => {
    deliveries = ['slow', 'fast']
    const zip = await download()
    expect(ranges).toHaveLength(2)
    expect(ranges[1]).toMatch(/^bytes=\d+-$/)
    expect(fs.readFileSync(zip).equals(ARCHIVE)).toBe(true)
  })

  it('stops reconnecting when a new connection is no faster: the line is the limit', async () => {
    deliveries = ['slow', 'slow']
    const zip = await download()
    expect(ranges).toHaveLength(2)
    expect(fs.readFileSync(zip).equals(ARCHIVE)).toBe(true)
  })

  it('fails after stalling connections in a row, keeping what was received', async () => {
    deliveries = ['stall', 'silent']
    await expect(download()).rejects.toThrow('Download interrupted')
    expect(ranges).toEqual([undefined, 'bytes=2048-', 'bytes=2048-'])
    expect(fs.statSync(partialZipPath(destPath)).size).toBe(2048)
  })
})
