/** Remote game build version and release date for one environment. */
export interface GameVersionInfo {
  version: string | null
  releaseDate: string | null
}

/** Result of comparing the local launcher version with the latest release. */
export interface VersionCheckResult {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
}
