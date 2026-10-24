import { create } from 'zustand'

type VersionState = {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
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
        checking: false,
        checked: true
      })
    } catch (err) {
      console.error('[VersionStore] Version check failed:', err)
      set({ checking: false, checked: true })
    }
  }
}))
