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
  /** The new deb or rpm to download, for a launcher installed from one (ADR 0050). */
  latestLauncherDownloadUrl: string | null
  /** The package the launcher was installed from (`deb`, `rpm`), null for the others. */
  launcherPackageType: string | null
}
