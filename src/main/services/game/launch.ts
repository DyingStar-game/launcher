import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'
import { loadFreshGameToken } from '../auth'
import { openGameLog } from './gameLog'
import { getExecutablePath, getGameRoot } from './paths'
import { isGameRunning, watchGameProcess } from './processWatch'
import { gameSpawnEnv } from './spawnEnv'

/** Spawns the game executable with a fresh JWT (`--token=<jwt>`). */
export async function launchGame(
  installPath: string,
  env: Parameters<typeof loadFreshGameToken>[0]
): Promise<void> {
  if (isGameRunning()) {
    throw new Error('Game is already running.')
  }

  const token = await loadFreshGameToken(env)
  if (!token) {
    throw new Error('SESSION_EXPIRED')
  }

  const exePath = getExecutablePath(installPath)
  if (!fs.existsSync(exePath)) {
    throw new Error(`Executable not found: ${exePath}`)
  }
  if (process.platform === 'linux') fs.chmodSync(exePath, 0o755)

  const gameRoot = getGameRoot(installPath)
  const cwd = fs.existsSync(gameRoot) ? gameRoot : installPath

  const logFd = openGameLogOrNull(exePath)
  try {
    const child = spawn(exePath, [`--token=${token}`], {
      detached: true,
      stdio: logFd === null ? 'ignore' : ['ignore', logFd, logFd],
      cwd,
      env: gameSpawnEnv(process.env)
    })
    watchGameProcess(child)
    child.unref()
  } finally {
    // The game holds its own copy of the descriptor.
    if (logFd !== null) fs.closeSync(logFd)
  }
}

/** Opens the game log beside the launcher's `main.log`; null when it cannot be written. */
function openGameLogOrNull(exePath: string): number | null {
  try {
    return openGameLog(path.dirname(log.transports.file.getFile().path), exePath)
  } catch (err) {
    log.warn('[Game] Game log not written:', err)
    return null
  }
}
