import {
  ENDPOINTS,
  getDownloadBase,
  getTestingZipUrlForPlatform,
  getUniverseZipUrlForPlatform
} from '../../config/api'
import type { Env } from '@shared/types/env'

/** Resolves the ZIP download URL for the current platform and environment. */
export function getZipUrl(env: Env): string {
  const platform = process.platform

  if (env === 'universe') {
    const direct = getUniverseZipUrlForPlatform(platform)
    if (direct) return direct
  }

  if (env === 'universe-testing') {
    const direct = getTestingZipUrlForPlatform(platform)
    if (direct) return direct
  }

  const base = getDownloadBase(env)
  if (!base) throw new Error(`Env "${env}" is not configured — missing base URL.`)

  if (platform === 'win32') return ENDPOINTS.zipWin32(base)
  if (platform === 'linux') return ENDPOINTS.zipLinux(base)
  if (platform === 'darwin') return ENDPOINTS.zipDarwin(base)
  throw new Error(`Unsupported platform: ${platform}`)
}
