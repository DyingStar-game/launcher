import type { Env } from './env'

/** Remote game build version and release date for one environment. */
export interface GameVersionInfo {
  version: string | null
  releaseDate: string | null
}

/** Result of comparing local launcher and remote game/launcher versions. */
export interface VersionCheckResult {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
  latestGameVersions: Record<Env, GameVersionInfo>
}
