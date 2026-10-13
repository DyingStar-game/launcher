import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { readGameFiles, removeGameFiles, writeGameFiles } from './gameFiles'

const dataDir = vi.hoisted(() => ({ path: '' }))
vi.mock('electron', () => ({ app: { getPath: () => dataDir.path } }))

let installPath: string
let gameRoot: string

/** Writes a file under the game folder, creating its folders. */
function put(file: string): void {
  const target = path.join(gameRoot, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, file)
}

const left = (): string[] =>
  fs
    .readdirSync(gameRoot, { recursive: true })
    .map((file) => String(file).split(path.sep).join('/'))
    .sort()

beforeEach(() => {
  installPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-game-files-'))
  gameRoot = path.join(installPath, 'DyingStar')
  fs.mkdirSync(gameRoot)
  dataDir.path = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-launcher-data-'))
})

afterEach(() => {
  fs.rmSync(installPath, { recursive: true, force: true })
  fs.rmSync(dataDir.path, { recursive: true, force: true })
})

describe('readGameFiles / writeGameFiles', () => {
  it("reads back the recorded files, once each, from the launcher's data folder", () => {
    writeGameFiles(gameRoot, ['b.dll', 'a.pck', 'b.dll'])
    expect(readGameFiles(gameRoot)).toEqual(['a.pck', 'b.dll'])
    expect(fs.readdirSync(installPath)).toEqual(['DyingStar'])
    expect(fs.readdirSync(dataDir.path)).toEqual(['game-files.json'])
  })

  it('keeps one list per game folder', () => {
    const otherRoot = path.join(installPath, 'Other')
    writeGameFiles(gameRoot, ['a.pck'])
    writeGameFiles(otherRoot, ['b.pck'])
    expect(readGameFiles(gameRoot)).toEqual(['a.pck'])
    expect(readGameFiles(otherRoot)).toEqual(['b.pck'])
  })

  it('is null when nothing was recorded or the lists are unreadable', () => {
    expect(readGameFiles(gameRoot)).toBeNull()
    fs.writeFileSync(path.join(dataDir.path, 'game-files.json'), '{')
    expect(readGameFiles(gameRoot)).toBeNull()
  })
})

describe('removeGameFiles', () => {
  it('removes the listed files and the folders they leave empty, nothing else', () => {
    put('game.pck')
    put('lib/deep/old.dll')
    put('data/old.bin')
    put('data/mine.txt')
    put('screenshots/shot.png')

    removeGameFiles(gameRoot, ['game.pck', 'lib/deep/old.dll', 'data/old.bin', 'missing.dll'])

    expect(left()).toEqual(['data', 'data/mine.txt', 'screenshots', 'screenshots/shot.png'])
  })

  it('ignores paths outside the game folder', () => {
    fs.writeFileSync(path.join(installPath, 'outside.txt'), 'kept')
    removeGameFiles(gameRoot, ['../outside.txt', path.join(installPath, 'outside.txt'), ''])
    expect(fs.existsSync(path.join(installPath, 'outside.txt'))).toBe(true)
    expect(fs.existsSync(gameRoot)).toBe(true)
  })

  it('leaves a folder that now stands where a listed file was', () => {
    put('videos/clip.mp4')
    removeGameFiles(gameRoot, ['videos'])
    expect(left()).toEqual(['videos', 'videos/clip.mp4'])
  })
})
