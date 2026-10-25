import * as fs from 'fs'
import * as path from 'path'

/** File the game's output goes to, next to the launcher's own log. */
export const GAME_LOG_NAME = 'game.log'

/** The previous launch's output, kept for a player who relaunched after a crash. */
export const PREVIOUS_GAME_LOG_NAME = 'game.old.log'

/**
 * Opens a fresh game log in `dir`, the previous one kept as `game.old.log`, and returns its file
 * descriptor. The header names the executable, never the arguments (they carry the token).
 */
export function openGameLog(dir: string, exePath: string): number {
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, GAME_LOG_NAME)
  if (fs.existsSync(file)) fs.renameSync(file, path.join(dir, PREVIOUS_GAME_LOG_NAME))
  const fd = fs.openSync(file, 'w')
  fs.writeSync(fd, `=== ${new Date().toISOString()} ${exePath}\n`)
  return fd
}
