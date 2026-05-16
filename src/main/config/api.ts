import type { Env } from '@shared/types/env'

/**
 * Returns the API base URL for an environment, or null when unset.
 */
export function getApiBase(env: Env): string | null {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_API_BASE_UNIVERSE
      : import.meta.env.VITE_API_BASE_TESTING

  const trimmed = (raw ?? '').trim().replace(/\/$/, '')
  return trimmed || null
}

/**
 * Optional download host override; falls back to {@link getApiBase}.
 */
export function getDownloadBase(env: Env): string | null {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_GAME_DOWNLOAD_BASE_UNIVERSE
      : import.meta.env.VITE_GAME_DOWNLOAD_BASE_TESTING

  const trimmed = (raw ?? '').trim().replace(/\/$/, '')
  return trimmed || getApiBase(env)
}

/** Picks the platform-specific ZIP URL from env overrides. */
function pickZipUrlForPlatform(
  platform: NodeJS.Platform,
  urls: { win: string; linux: string; darwin: string }
): string | null {
  if (platform === 'win32') return urls.win || null
  if (platform === 'linux') return urls.linux || null
  if (platform === 'darwin') return urls.darwin || null
  return null
}

/** Full ZIP URL for production (`universe`) on the current platform. */
export function getUniverseZipUrlForPlatform(platform: NodeJS.Platform): string | null {
  return pickZipUrlForPlatform(platform, {
    win: (import.meta.env.VITE_GAME_ZIP_WINDOWS ?? '').trim(),
    linux: (import.meta.env.VITE_GAME_ZIP_LINUX ?? '').trim(),
    darwin: (import.meta.env.VITE_GAME_ZIP_DARWIN ?? '').trim()
  })
}

/** Full ZIP URL for testing (`universe-testing`) on the current platform. */
export function getTestingZipUrlForPlatform(platform: NodeJS.Platform): string | null {
  return pickZipUrlForPlatform(platform, {
    win: (import.meta.env.VITE_GAME_ZIP_TESTING_WINDOWS ?? '').trim(),
    linux: (import.meta.env.VITE_GAME_ZIP_TESTING_LINUX ?? '').trim(),
    darwin: (import.meta.env.VITE_GAME_ZIP_TESTING_DARWIN ?? '').trim()
  })
}

/** Derives the status subdomain from the main API base URL. */
export function getStatusBase(apiBase: string): string {
  try {
    const url = new URL(apiBase)
    if (!url.hostname.startsWith('status.')) {
      url.hostname = `status.${url.hostname}`
    }
    return url.origin
  } catch {
    return apiBase
  }
}

/** Parses a positive Cachet component/metric id from env with fallback. */
function parseStatusNumericId(raw: string | undefined, fallback: number): number {
  const n = Number(String(raw ?? '').trim())
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** Cachet component id for server status (`/api/components/:id`). */
export function getStatusComponentId(env: Env): number {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_COMPONENT_ID_UNIVERSE
      : import.meta.env.VITE_STATUS_COMPONENT_ID_TESTING
  return parseStatusNumericId(raw, 3)
}

/** Cachet metric id for player count (`/api/metrics/:id/points`). */
export function getStatusMetricId(env: Env): number {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_METRIC_ID_UNIVERSE
      : import.meta.env.VITE_STATUS_METRIC_ID_TESTING
  return parseStatusNumericId(raw, 2)
}

/** Endpoint builders derived from a base API URL. */
export const ENDPOINTS = {
  version: (base: string): string => `${base}/version`,
  status: (base: string, componentId: number): string =>
    `${getStatusBase(base)}/api/components/${componentId}`,
  metrics: (base: string, metricId: number): string =>
    `${getStatusBase(base)}/api/metrics/${metricId}/points?sort=-id`,
  zipWin32: (base: string): string => `${base}/game/latest-windows.zip`,
  zipLinux: (base: string): string => `${base}/game/latest-linux.zip`,
  zipDarwin: (base: string): string => `${base}/game/latest-macos.zip`,
  authBase: (base: string): string => {
    try {
      const url = new URL(base)
      if (!url.hostname.startsWith('auth-preprod.') && !url.hostname.startsWith('auth.')) {
        url.hostname = `auth-preprod.${url.hostname}`
      }
      return url.origin
    } catch {
      return base
    }
  }
}
