import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const CACHE_DIR_NAMES = ['shader_cache', 'chunk_cache'] as const

/**
 * Godot userdata root for the DyingStar project (same layout as the game).
 * - Linux:   ~/.local/share/godot/app_userdata/DyingStar
 * - Windows: %AppData%/Godot/app_userdata/DyingStar
 * - macOS:   ~/Library/Application Support/Godot/app_userdata/DyingStar
 */
export function getDyingStarGodotUserdataRoot(): string {
  if (process.platform === 'linux') {
    return path.join(app.getPath('home'), '.local', 'share', 'godot', 'app_userdata', 'DyingStar')
  }
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return path.join(app.getPath('appData'), 'Godot', 'app_userdata', 'DyingStar')
  }
  throw new Error(`Unsupported platform for Godot cache: ${process.platform}`)
}

export type ClearGodotCacheResult = {
  root: string
  /** Directories that were removed */
  removed: string[]
  /** Cache directories that were already absent */
  skipped: string[]
  /** Per-path errors */
  errors: { path: string; message: string }[]
}

/** Returns true when the path exists and is a directory. */
function isExistingDirectory(p: string): boolean {
  try {
    if (!fs.existsSync(p)) return false
    return fs.statSync(p).isDirectory()
  } catch {
    return false
  }
}

/**
 * Removes only `shader_cache` and `chunk_cache` under DyingStar userdata.
 * Missing paths are skipped without throwing.
 */
export function clearDyingStarGodotCaches(): ClearGodotCacheResult {
  const root = getDyingStarGodotUserdataRoot()
  const removed: string[] = []
  const skipped: string[] = []
  const errors: { path: string; message: string }[] = []

  for (const dirName of CACHE_DIR_NAMES) {
    const target = path.join(root, dirName)
    if (!isExistingDirectory(target)) {
      skipped.push(target)
      continue
    }
    try {
      if (!isExistingDirectory(target)) {
        skipped.push(target)
        continue
      }
      fs.rmSync(target, { recursive: true, force: true })
      removed.push(target)
    } catch (err) {
      errors.push({
        path: target,
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  return { root, removed, skipped, errors }
}
