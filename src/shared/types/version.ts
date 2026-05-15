import type { Env } from './env'

export interface GameVersionInfo {
  version: string | null
  releaseDate: string | null
}

export interface VersionCheckResult {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
  latestGameVersions: Record<Env, GameVersionInfo>
}
