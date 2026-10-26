import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import type { BrowserWindow } from 'electron'
import { extractZip } from './extract'
import { zipOf } from '../../test/zipFixture'

let dir: string
let dest: string
const send = vi.fn()
const win = { isDestroyed: () => false, webContents: { send } } as unknown as BrowserWindow

/** Writes an archive holding these files and extracts it into `dest`. */
async function extract(files: Record<string, string>): Promise<void> {
  const zipPath = path.join(dir, 'game.zip')
  fs.writeFileSync(zipPath, zipOf(files))
  await extractZip(zipPath, dest, win)
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-extract-'))
  dest = path.join(dir, 'game', 'DyingStar')
  fs.mkdirSync(dest, { recursive: true })
  send.mockClear()
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('extractZip', () => {
  it('writes files and folders, reporting progress per file', async () => {
    await extract({ 'data/': '', 'data/a.pck': 'a', 'version.json': '{}' })

    expect(fs.readFileSync(path.join(dest, 'data', 'a.pck'), 'utf8')).toBe('a')
    expect(fs.readFileSync(path.join(dest, 'version.json'), 'utf8')).toBe('{}')
    const labels = send.mock.calls.map(([, , label]) => label)
    expect(labels.at(-1)).toEqual({ key: 'extracting', current: 2, total: 2 })
  })

  // `/dev/full` fails every write with ENOSPC: the disk filling up during extraction (ADR 0047)
  it.skipIf(!fs.existsSync('/dev/full'))('rejects with ENOSPC when the disk is full', async () => {
    fs.symlinkSync('/dev/full', path.join(dest, 'a.pck'))

    await expect(extract({ 'a.pck': 'x'.repeat(100_000) })).rejects.toMatchObject({
      code: 'ENOSPC'
    })
  })

  it.each([['../evil.txt'], ['data/../../evil.txt'], ['/tmp/evil.txt']])(
    'refuses an archive with an entry leaving the game folder (%s), writing nothing',
    async (name) => {
      await expect(extract({ 'a.pck': 'a', [name]: 'x' })).rejects.toThrow(/Malicious entry/)

      expect(fs.readdirSync(dest)).toEqual([])
      expect(fs.readdirSync(path.join(dir, 'game'))).toEqual(['DyingStar'])
    }
  )
})
