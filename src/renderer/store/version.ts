import { create } from 'zustand'
import type { Env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameVersionInfo = {
  version:     string | null
  releaseDate: string | null
}

type VersionState = {
  // Launcher
  currentLauncherVersion:  string
  latestLauncherVersion:   string | null
  launcherUpdateAvailable: boolean

  // Jeu par env — version ET date de la release distante
  latestGameVersions: Record<Env, GameVersionInfo>

  checking: boolean
  checked:  boolean

  checkVersions: () => Promise<void>
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const defaultGameVersionInfo: GameVersionInfo = { version: null, releaseDate: null }

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVersionStore = create<VersionState>((set) => ({
  currentLauncherVersion:  '',
  latestLauncherVersion:   null,
  launcherUpdateAvailable: false,

  latestGameVersions: {
    'universe':         { ...defaultGameVersionInfo },
    'universe-testing': { ...defaultGameVersionInfo }
  },

  checking: false,
  checked:  false,

  checkVersions: async () => {
    set({ checking: true })
    try {
      const result = await window.api.checkVersions()
      set({
        currentLauncherVersion:  result.currentLauncherVersion,
        latestLauncherVersion:   result.latestLauncherVersion,
        launcherUpdateAvailable: result.launcherUpdateAvailable,
        latestGameVersions:      result.latestGameVersions,
        checking: false,
        checked:  true
      })
    } catch (err) {
      console.error('[VersionStore] Échec du check :', err)
      set({ checking: false, checked: true })
    }
  }
}))