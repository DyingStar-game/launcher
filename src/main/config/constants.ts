/** Parses a positive integer from an env string with a numeric fallback. */
export function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** HTTP / fetch timeouts (milliseconds). Overridable via VITE_* env vars. */
export const HTTP_TIMEOUT_MS = {
  api: parsePositiveInt(import.meta.env.VITE_HTTP_TIMEOUT_API_MS, 8_000),
  versionPing: parsePositiveInt(import.meta.env.VITE_HTTP_TIMEOUT_VERSION_PING_MS, 5_000),
  github: parsePositiveInt(import.meta.env.VITE_HTTP_TIMEOUT_GITHUB_MS, 10_000),
  download: parsePositiveInt(import.meta.env.VITE_DOWNLOAD_TIMEOUT_MS, 600_000)
} as const

/** Game process poll interval when tracking a running child (milliseconds). */
export const GAME_PROCESS_POLL_MS = parsePositiveInt(
  import.meta.env.VITE_GAME_PROCESS_POLL_MS,
  2_000
)

/** Install layout: subdirectory name inside the user-chosen install path. */
export const GAME_INSTALL_SUBDIR =
  (import.meta.env.VITE_GAME_INSTALL_SUBDIR ?? 'DyingStar').trim() || 'DyingStar'

/** Temporary ZIP filename during download. */
export const GAME_DOWNLOAD_ZIP_NAME = '__game_download.zip'

/** Platform-specific game executable names (relative to game root). */
export const GAME_EXECUTABLES: Partial<Record<NodeJS.Platform, string>> = {
  win32: (import.meta.env.VITE_GAME_EXE_WINDOWS ?? 'DyingStar.exe').trim() || 'DyingStar.exe',
  linux: (import.meta.env.VITE_GAME_EXE_LINUX ?? 'DyingStar.x86_64').trim() || 'DyingStar.x86_64',
  darwin: (import.meta.env.VITE_GAME_EXE_DARWIN ?? 'DyingStar.app').trim() || 'DyingStar.app'
}

/** Custom protocol scheme for OAuth callbacks. */
export const APP_PROTOCOL = (import.meta.env.VITE_APP_PROTOCOL ?? 'dyingstar').trim() || 'dyingstar'

/** User-Agent sent when downloading game archives. */
export const DOWNLOAD_USER_AGENT =
  (import.meta.env.VITE_DOWNLOAD_USER_AGENT ?? 'DyingStar-Launcher/1.0').trim() ||
  'DyingStar-Launcher/1.0'

/** Download progress phase weights (0–100 scale). */
export const DOWNLOAD_PROGRESS = {
  zipWeight: 70,
  unknownChunkBytes: 2 * 1024 * 1024,
  unknownSizeCapBytes: 80 * 1024 * 1024
} as const
