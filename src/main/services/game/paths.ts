import * as fs from 'fs'
import * as path from 'path'
import { GAME_EXECUTABLES, GAME_INSTALL_SUBDIR } from '../../config/constants'

export { GAME_INSTALL_SUBDIR }

/** Returns the game payload directory inside the user install path. */
export function getGameRoot(installPath: string): string {
  return path.join(installPath, GAME_INSTALL_SUBDIR)
}

/** True when the platform executable (or legacy layout) is present on disk. */
export function isGameInstalledAtPath(installPath: string): boolean {
  if (!installPath?.trim()) return false
  try {
    return fs.existsSync(getExecutablePath(path.resolve(installPath)))
  } catch {
    return false
  }
}

/** Resolves the platform game executable (payload dir first, then legacy install root). */
export function getExecutablePath(installPath: string): string {
  const exe = GAME_EXECUTABLES[process.platform]
  if (!exe) throw new Error(`Unsupported platform: ${process.platform}`)
  const inPayload = path.join(getGameRoot(installPath), exe)
  if (fs.existsSync(inPayload)) return inPayload
  const legacy = path.join(installPath, exe)
  if (fs.existsSync(legacy)) return legacy
  return inPayload
}
