import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { readGameFiles, removeGameFiles, writeGameFiles } from './gameFiles'

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
})

afterEach(() => {
  fs.rmSync(installPath, { recursive: true, force: true })
})

describe('readGameFiles / writeGameFiles', () => {
  it('reads back the recorded files, once each', () => {
    writeGameFiles(installPath, ['b.dll', 'a.pck', 'b.dll'])
    expect(readGameFiles(installPath)).toEqual(['a.pck', 'b.dll'])
  })

  it('is null when nothing was recorded or the list is unreadable', () => {
    expect(readGameFiles(installPath)).toBeNull()
    fs.writeFileSync(path.join(installPath, '__game_files.json'), '{')
    expect(readGameFiles(installPath)).toBeNull()
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
