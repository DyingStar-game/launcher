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

/** A ZIP holding stored (uncompressed) files, by path. */
function zipOf(files: Record<string, string>): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
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
    central.writeUInt32LE(offset, 42)
    locals.push(local, fileName, data)
    centrals.push(central, fileName)
    offset += local.length + fileName.length + data.length
  }
  const centralSize = centrals.reduce((size, part) => size + part.length, 0)
  const count = Object.keys(files).length
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(count, 8)
  end.writeUInt16LE(count, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, ...centrals, end])
}

const VERSION_JSON = JSON.stringify({ version: '20261012000000', releaseDate: '2026-10-12' })

// Padded so a download can be stopped half-way
const ARCHIVE = zipOf({
  'version.json': JSON.stringify({
    version: '20261012000000',
    releaseDate: '2026-10-12',
    pad: 'x'.repeat(4096)
  })
})
const ETAG = '"v1"'
const HALF = Math.floor(ARCHIVE.length / 2)

type Mode = 'normal' | 'stall' | 'drop' | 'trickle'
let mode: Mode
let archive: Buffer
let requests: http.IncomingHttpHeaders[]
let server: http.Server
let installPath: string
const send = vi.fn()
const win = { isDestroyed: () => false, webContents: { send } } as unknown as BrowserWindow

beforeEach(async () => {
  mode = 'normal'
  archive = ARCHIVE
  requests = []
  installPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-install-'))
  server = http.createServer((req, res) => {
    requests.push(req.headers)
    const range = req.headers.range?.match(/^bytes=(\d+)-$/)
    const start = range && req.headers['if-range'] === ETAG ? Number(range[1]) : 0
    const body = archive.subarray(start)
    const headers = { ETag: ETAG, 'Content-Length': String(body.length) }
    if (start > 0) {
      res.writeHead(206, {
        ...headers,
        'Content-Range': `bytes ${start}-${archive.length - 1}/${archive.length}`
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
    expect(filesLeft()).toEqual(['DyingStar', '__game_files.json'])
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
    expect(filesLeft()).toEqual(['DyingStar', '__game_files.json'])
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

  it("updates the game, keeping the player's files and removing the ones it no longer ships", async () => {
    archive = zipOf({
      'version.json': VERSION_JSON,
      'old.dll': 'old',
      'game.pck': 'v1',
      'data/old.bin': 'old'
    })
    await downloadAndInstall('universe', installPath, win)
    const gameRoot = path.join(installPath, 'DyingStar')
    fs.mkdirSync(path.join(gameRoot, 'screenshots'))
    fs.writeFileSync(path.join(gameRoot, 'screenshots', 'shot.png'), 'png')
    fs.writeFileSync(path.join(gameRoot, 'data', 'mine.txt'), 'mine')

    archive = zipOf({ 'version.json': VERSION_JSON, 'game.pck': 'v2', 'lib/new.dll': 'new' })
    await downloadAndInstall('universe', installPath, win)

    expect(fs.readdirSync(gameRoot, { recursive: true }).sort()).toEqual([
      'data',
      path.join('data', 'mine.txt'),
      'game.pck',
      'lib',
      path.join('lib', 'new.dll'),
      'screenshots',
      path.join('screenshots', 'shot.png'),
      'version.json'
    ])
    expect(fs.readFileSync(path.join(gameRoot, 'game.pck'), 'utf8')).toBe('v2')
  })

  it('removes nothing from a game it never recorded, extracting over it', async () => {
    const gameRoot = path.join(installPath, 'DyingStar')
    fs.mkdirSync(gameRoot)
    fs.writeFileSync(path.join(gameRoot, 'old.dll'), 'old')
    fs.writeFileSync(path.join(gameRoot, 'version.json'), 'old')

    await downloadAndInstall('universe', installPath, win)

    expect(fs.readdirSync(gameRoot).sort()).toEqual(['old.dll', 'version.json'])
    expect(
      JSON.parse(fs.readFileSync(path.join(installPath, '__game_files.json'), 'utf8'))
    ).toEqual(['version.json'])
  })

  it('has nothing to pause once nothing runs', () => {
    expect(pauseInstall('universe')).toBe(false)
  })
})
