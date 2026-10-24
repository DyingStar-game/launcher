import { create } from 'zustand'

type VersionState = {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
  /** The new deb or rpm to download, for a launcher installed from one (ADR 0050). */
  latestLauncherDownloadUrl: string | null
  /** The package the launcher was installed from (`deb`, `rpm`), null for the others. */
  launcherPackageType: string | null
  checking: boolean
  checked: boolean
  /** Compares the launcher with its latest release (GitHub), once at startup. */
  checkVersions: () => Promise<void>
}

/**
 * Launcher version state for the update banner; the game versions are a query
 * (`useLatestGameVersion`, ADR 0025, 0045).
 */
export const useVersionStore = create<VersionState>((set) => ({
  currentLauncherVersion: '',
  latestLauncherVersion: null,
  latestLauncherReleaseDate: null,
  launcherUpdateAvailable: false,
  latestLauncherDownloadUrl: null,
  launcherPackageType: null,

  checking: false,
  checked: false,

  checkVersions: async () => {
    set({ checking: true })
    try {
      const result = await window.api.checkVersions()
      set({
        currentLauncherVersion: result.currentLauncherVersion,
        latestLauncherVersion: result.latestLauncherVersion,
        latestLauncherReleaseDate: result.latestLauncherReleaseDate,
        launcherUpdateAvailable: result.launcherUpdateAvailable,
        latestLauncherDownloadUrl: result.latestLauncherDownloadUrl,
        launcherPackageType: result.launcherPackageType,
        checking: false,
        checked: true
      })
    } catch (err) {
      console.error('[VersionStore] Version check failed:', err)
      set({ checking: false, checked: true })
    }
  }
}))
