import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import * as http from 'http'
import * as os from 'os'
import * as path from 'path'
import { crc32 } from 'zlib'
import type { AddressInfo } from 'net'
import type { BrowserWindow } from 'electron'

vi.mock('./zipUrl', () => ({ getZipUrl: vi.fn() }))

import { getZipUrl } from './zipUrl'
import { cancelInstall, downloadAndInstall, pauseInstall } from './install'
import { findPendingDownload, writeDownloadMeta } from './partial'

/** A ZIP holding one stored (uncompressed) file. */
function zipOf(name: string, content: string): Buffer {
  const data = Buffer.from(content)
  const fileName = Buffer.from(name)
  const crc = crc32(data)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(fileName.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(fileName.length, 28)
  const centralOffset = local.length + fileName.length + data.length
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + fileName.length, 12)
  end.writeUInt32LE(centralOffset, 16)
  return Buffer.concat([local, fileName, data, central, fileName, end])
}

// Padded so a download can be stopped half-way
const ARCHIVE = zipOf(
  'version.json',
  JSON.stringify({ version: '20261012000000', releaseDate: '2026-10-12', pad: 'x'.repeat(4096) })
)
const ETAG = '"v1"'
const HALF = Math.floor(ARCHIVE.length / 2)

type Mode = 'normal' | 'stall' | 'drop' | 'trickle'
let mode: Mode
let requests: http.IncomingHttpHeaders[]
let server: http.Server
let installPath: string
const send = vi.fn()
const win = { isDestroyed: () => false, webContents: { send } } as unknown as BrowserWindow

beforeEach(async () => {
  mode = 'normal'
  requests = []
  installPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-install-'))
  server = http.createServer((req, res) => {
    requests.push(req.headers)
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
    if (mode === 'normal') {
      res.end(body)
      return
    }
    if (mode === 'trickle') {
      // Many small chunks in a burst, as a fast connection delivers them
      let offset = 0
      const next = (): void => {
        if (offset >= body.length) return void res.end()
        res.write(body.subarray(offset, offset + 256))
        offset += 256
        setImmediate(next)
      }
      next()
      return
    }
    // Half the archive, then nothing (stall) or a dropped connection (drop)
    res.write(body.subarray(0, Math.floor(body.length / 2)))
    if (mode === 'drop') setTimeout(() => res.destroy(), 20)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  vi.mocked(getZipUrl).mockReturnValue(`http://127.0.0.1:${port}/game.zip`)
})

afterEach(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
  fs.rmSync(installPath, { recursive: true, force: true })
  vi.clearAllMocks()
})

/** Resolves once the download has received its first bytes. */
const downloading = (): Promise<void> =>
  vi.waitFor(() => {
    const keys = send.mock.calls.map(([, , label]) => label.key)
    if (!keys.includes('downloading')) throw new Error('not downloading yet')
  })

const filesLeft = (): string[] => fs.readdirSync(installPath).sort()

describe('downloadAndInstall', () => {
  it('downloads, extracts, and leaves no download files behind', async () => {
    const outcome = await downloadAndInstall('universe', installPath, win)
    expect(outcome).toEqual({
      status: 'installed',
      version: '20261012000000',
      releaseDate: '2026-10-12'
    })
    expect(filesLeft()).toEqual(['DyingStar'])
    expect(requests[0].range).toBeUndefined()
  })

  it('pauses, keeping what was received, and resumes from there', async () => {
    mode = 'stall'
    const install = downloadAndInstall('universe', installPath, win)
    await downloading()
    expect(pauseInstall('universe')).toBe(true)
    expect(await install).toEqual({ status: 'paused' })

    const pending = findPendingDownload('universe', installPath)
    expect(pending).toMatchObject({ downloaded: HALF, total: ARCHIVE.length })
    // Another environment's download is not this one's
    expect(findPendingDownload('universe-testing', installPath)).toBeNull()

    mode = 'normal'
    expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
      status: 'installed'
    })
    expect(requests[1]).toMatchObject({ range: `bytes=${HALF}-`, 'if-range': ETAG })
    expect(filesLeft()).toEqual(['DyingStar'])
  })

  it('downloads it all again when the archive changed', async () => {
    fs.writeFileSync(path.join(installPath, '__game_download.zip'), ARCHIVE.subarray(0, 100))
    writeDownloadMeta(installPath, {
      env: 'universe',
      url: vi.mocked(getZipUrl)('universe'),
      etag: '"v0"',
      lastModified: null,
      total: ARCHIVE.length + 10
    })
    expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
      status: 'installed'
    })
  })

  it('cancels a download, removing what was received', async () => {
    mode = 'stall'
    const install = downloadAndInstall('universe', installPath, win)
    await downloading()
    expect(cancelInstall('universe', installPath)).toBe(true)
    expect(await install).toEqual({ status: 'cancelled' })
    expect(filesLeft()).toEqual([])
  })

  it('cancels a paused download', async () => {
    mode = 'stall'
    const install = downloadAndInstall('universe', installPath, win)
    await downloading()
    pauseInstall('universe')
    await install
    expect(cancelInstall('universe', installPath)).toBe(true)
    expect(filesLeft()).toEqual([])
  })

  it('keeps an interrupted download, to resume it', async () => {
    mode = 'drop'
    await expect(downloadAndInstall('universe', installPath, win)).rejects.toThrow()
    expect(findPendingDownload('universe', installPath)).toMatchObject({
      downloaded: HALF
    })
  })

  it('reports a burst of chunks in a few progress events, the last bytes included', async () => {
    mode = 'trickle'
    await downloadAndInstall('universe', installPath, win)
    const downloads = send.mock.calls
      .map(([, , label]) => label)
      .filter((label) => label.key === 'downloading')
    expect(downloads.length).toBeLessThanOrEqual(3)
    expect(downloads.at(-1)).toMatchObject({ downloaded: ARCHIVE.length })
  })

  it('has nothing to pause once nothing runs', () => {
    expect(pauseInstall('universe')).toBe(false)
  })
})
