import { create } from 'zustand'
import type { Env } from './env'
import type { GameVersionInfo } from '@shared/types/version'

export type { GameVersionInfo } from '@shared/types/version'

type VersionState = {
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable: boolean
  /** Latest remote game version per environment (from API `/version`). */
  latestGameVersions: Record<Env, GameVersionInfo>
  checking: boolean
  checked: boolean
  /** Fetches launcher (GitHub) and game (API) version info from the main process. */
  checkVersions: () => Promise<void>
  /**
   * Refreshes the latest game versions only, while the launcher runs (ADR 0039); an environment
   * whose API does not answer keeps the version known.
   */
  refreshGameVersions: () => Promise<void>
}

const defaultGameVersionInfo: GameVersionInfo = { version: null, releaseDate: null }

/**
 * Launcher and per-env game version state for update banners.
 */
export const useVersionStore = create<VersionState>((set, get) => ({
  currentLauncherVersion: '',
  latestLauncherVersion: null,
  latestLauncherReleaseDate: null,
  launcherUpdateAvailable: false,

  latestGameVersions: {
    universe: { ...defaultGameVersionInfo },
    'universe-testing': { ...defaultGameVersionInfo }
  },

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
        latestGameVersions: result.latestGameVersions,
        checking: false,
        checked: true
      })
    } catch (err) {
      console.error('[VersionStore] Version check failed:', err)
      set({ checking: false, checked: true })
    }
  },

  refreshGameVersions: async () => {
    try {
      const latest = await window.api.checkGameVersions()
      const known = get().latestGameVersions
      set({
        latestGameVersions: {
          universe: latest.universe.version ? latest.universe : known.universe,
          'universe-testing': latest['universe-testing'].version
            ? latest['universe-testing']
            : known['universe-testing']
        }
      })
    } catch (err) {
      console.warn('[VersionStore] Game version refresh failed:', err)
    }
  }
}))
