/** Path lists the AppImage's `AppRun` prefixes with directories of its own mount. */
const APPIMAGE_PATH_LISTS = ['PATH', 'LD_LIBRARY_PATH', 'XDG_DATA_DIRS', 'GSETTINGS_SCHEMA_DIR']

/** Variables the AppImage runtime sets to describe itself. */
const APPIMAGE_VARS = ['APPDIR', 'APPIMAGE', 'ARGV0', 'OWD']

/**
 * Environment for the game process: the launcher's own, without what the AppImage and Electron
 * changed for themselves (the AppImage's libraries would otherwise be loaded by the game).
 */
export function gameSpawnEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const next = { ...env }

  // Electron replaces XDG_CURRENT_DESKTOP on Linux and keeps the player's value aside.
  if (next.ORIGINAL_XDG_CURRENT_DESKTOP !== undefined) {
    next.XDG_CURRENT_DESKTOP = next.ORIGINAL_XDG_CURRENT_DESKTOP
    delete next.ORIGINAL_XDG_CURRENT_DESKTOP
  }

  const appDir = next.APPDIR
  if (!appDir) return next

  for (const name of APPIMAGE_PATH_LISTS) {
    const value = next[name]
    if (value === undefined) continue
    const kept = value.split(':').filter((dir) => dir !== '' && !dir.startsWith(appDir))
    if (kept.length > 0) next[name] = kept.join(':')
    else delete next[name]
  }
  for (const name of APPIMAGE_VARS) delete next[name]
  return next
}
