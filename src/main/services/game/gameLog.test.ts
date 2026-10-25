import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GAME_LOG_NAME, PREVIOUS_GAME_LOG_NAME, openGameLog } from './gameLog'

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-log-'))
})

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

/** Opens the log, writes `text` as the game would and closes it. */
function launch(logDir: string, text: string): void {
  const fd = openGameLog(logDir, '/games/DyingStar/DyingStar.x86_64')
  fs.writeSync(fd, text)
  fs.closeSync(fd)
}

describe('openGameLog', () => {
  it('creates the folder and starts the log with the executable', () => {
    const logDir = path.join(dir, 'logs')
    launch(logDir, 'Godot Engine\n')

    const content = fs.readFileSync(path.join(logDir, GAME_LOG_NAME), 'utf8')
    expect(content).toMatch(/^=== \S+ \/games\/DyingStar\/DyingStar\.x86_64\nGodot Engine\n$/)
  })

  it('keeps the previous launch aside', () => {
    launch(dir, 'first launch\n')
    launch(dir, 'second launch\n')

    expect(fs.readFileSync(path.join(dir, PREVIOUS_GAME_LOG_NAME), 'utf8')).toContain(
      'first launch'
    )
    const current = fs.readFileSync(path.join(dir, GAME_LOG_NAME), 'utf8')
    expect(current).toContain('second launch')
    expect(current).not.toContain('first launch')
  })
})
