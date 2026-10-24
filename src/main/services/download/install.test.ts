import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import * as http from 'http'
import * as os from 'os'
import * as path from 'path'
import type { AddressInfo } from 'net'
import type { BrowserWindow } from 'electron'

vi.mock('./zipUrl', () => ({ getZipUrl: vi.fn() }))
// Connections tried again without waiting (ADR 0039)
vi.mock('../../config/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/constants')>()
  return { ...actual, DOWNLOAD_RECONNECT: { ...actual.DOWNLOAD_RECONNECT, retryDelayMs: 1 } }
})
// The launcher's data folder, where the game's file list lives (ADR 0038)
const dataDir = vi.hoisted(() => ({ path: '' }))
vi.mock('electron', () => ({ app: { getPath: () => dataDir.path } }))

// Free disk space, one value per check: before downloading, then before extracting (ADR 0047)
const disk = vi.hoisted(() => ({ free: [] as number[], writeFails: false, extractFails: false }))
vi.mock('./disk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./disk')>()
  return { ...actual, freeBytes: vi.fn(async () => disk.free.shift() ?? Number.MAX_SAFE_INTEGER) }
})
/** The error the file system gives once the disk is full. */
const noSpace = (): Error =>
  Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' })
// The disk filling up while the archive is written…
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  const { Writable } = await import('stream')
  const createWriteStream = ((...args: Parameters<typeof actual.createWriteStream>) =>
    disk.writeFails
      ? new Writable({ write: (_chunk, _encoding, done) => done(noSpace()) })
      : actual.createWriteStream(...args)) as typeof actual.createWriteStream
  return { ...actual, default: { ...actual, createWriteStream }, createWriteStream }
})
// …or while it is extracted
vi.mock('./extract', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./extract')>()
  return {
    extractZip: vi.fn(async (...args: Parameters<typeof actual.extractZip>) => {
      if (disk.extractFails) throw noSpace()
      return actual.extractZip(...args)
    })
  }
})

import { getZipUrl } from './zipUrl'
import { cancelInstall, downloadAndInstall, pauseInstall } from './install'
import { findPendingDownload, writeDownloadMeta } from './partial'
import { readGameFiles } from './gameFiles'
import { zipOf } from '../../test/zipFixture'

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
  disk.free = []
  disk.writeFails = false
  disk.extractFails = false
  mode = 'normal'
  archive = ARCHIVE
  requests = []
  installPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-install-'))
  dataDir.path = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-launcher-data-'))
  server = http.createServer((req, res) => {
    requests.push(req.headers)
    // A server gone after dropping the first connection: the others get no answer
    if (mode === 'drop' && requests.length > 1) return void req.socket.destroy()
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
  fs.rmSync(dataDir.path, { recursive: true, force: true })
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

  it('keeps an interrupted download, to resume it, once new connections fail too', async () => {
    mode = 'drop'
    await expect(downloadAndInstall('universe', installPath, win)).rejects.toThrow(
      'Download interrupted'
    )
    expect(requests).toHaveLength(6)
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
    expect(readGameFiles(gameRoot)).toEqual(['version.json'])
  })

  describe('disk full (ADR 0047)', () => {
    /** A game installed before, with a file of the player's beside it. */
    function installedGame(): string {
      const gameRoot = path.join(installPath, 'DyingStar')
      fs.mkdirSync(gameRoot, { recursive: true })
      fs.writeFileSync(path.join(gameRoot, 'version.json'), VERSION_JSON)
      return gameRoot
    }

    it('downloads nothing when the archive does not fit', async () => {
      disk.free = [100]
      expect(await downloadAndInstall('universe', installPath, win)).toEqual({
        status: 'diskFull',
        needed: ARCHIVE.length,
        available: 100
      })
      expect(findPendingDownload('universe', installPath)).toBeNull()
    })

    it('says the disk is full when it fills up while the archive is written', async () => {
      disk.writeFails = true
      disk.free = [Number.MAX_SAFE_INTEGER, 50]
      const outcome = await downloadAndInstall('universe', installPath, win)
      expect(outcome).toEqual({ status: 'diskFull', needed: ARCHIVE.length, available: 50 })
      expect(requests).toHaveLength(1)
    })

    it('touches neither the game nor the archive when the new files do not fit', async () => {
      const gameRoot = installedGame()
      // Room for the archive, not for its files once extracted
      disk.free = [Number.MAX_SAFE_INTEGER, 10]
      expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
        status: 'diskFull',
        available: 10
      })
      expect(fs.readFileSync(path.join(gameRoot, 'version.json'), 'utf8')).toBe(VERSION_JSON)
      expect(findPendingDownload('universe', installPath)).toMatchObject({
        downloaded: ARCHIVE.length
      })

      // Space freed: Resume goes straight to extraction
      expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
        status: 'installed'
      })
      expect(requests).toHaveLength(1)
    })

    it('keeps the archive, to resume, when the disk fills up while extracting', async () => {
      disk.extractFails = true
      expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
        status: 'diskFull'
      })
      expect(findPendingDownload('universe', installPath)).toMatchObject({
        downloaded: ARCHIVE.length
      })

      disk.extractFails = false
      expect(await downloadAndInstall('universe', installPath, win)).toMatchObject({
        status: 'installed'
      })
      expect(filesLeft()).toEqual(['DyingStar'])
    })
  })

  it('has nothing to pause once nothing runs', () => {
    expect(pauseInstall('universe')).toBe(false)
  })
})
