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

/** Finds CHANGELOG.md at the root or one level below `root`. */
function findChangelogUnderRoot(root: string): string | null {
  const direct = path.join(root, 'CHANGELOG.md')
  try {
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  } catch {
    /* try subdirectories */
  }
  try {
    for (const e of fs.readdirSync(root, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      const nested = path.join(root, e.name, 'CHANGELOG.md')
      try {
        if (fs.existsSync(nested) && fs.statSync(nested).isFile()) return nested
      } catch {
        /* continue */
      }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Resolves CHANGELOG path: prefers `installPath/DyingStar/`, falls back to legacy layout.
 */
export function findChangelogPath(installPath: string): string | null {
  const resolved = path.resolve(installPath)
  const gameRoot = getGameRoot(resolved)
  try {
    if (fs.existsSync(gameRoot) && fs.statSync(gameRoot).isDirectory()) {
      return findChangelogUnderRoot(gameRoot)
    }
  } catch {
    /* legacy layout */
  }
  return findChangelogUnderRoot(resolved)
}
