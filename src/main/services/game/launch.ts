import { spawn } from 'child_process'
import * as fs from 'fs'
import { loadFreshGameToken } from '../auth'
import { getExecutablePath, getGameRoot } from './paths'
import { isGameRunning, watchGameProcess } from './processWatch'

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

  const child = spawn(exePath, [`--token=${token}`], {
    detached: true,
    stdio: 'ignore',
    cwd
  })
  watchGameProcess(child)
  child.unref()
}
