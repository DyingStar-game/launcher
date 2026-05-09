import { create } from 'zustand'
import type { Env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

type VersionState = {
  // Launcher
  currentLauncherVersion: string
  latestLauncherVersion: string | null
  launcherUpdateAvailable: boolean

  // Jeu par env
  latestGameVersions: Record<Env, string | null>

  // État du check
  checking: boolean
  checked: boolean

  checkVersions: () => Promise<void>
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVersionStore = create<VersionState>((set) => ({
  currentLauncherVersion: '',
  latestLauncherVersion: null,
  launcherUpdateAvailable: false,

  latestGameVersions: {
    'universe':         null,
    'universe-testing': null
  },

  checking: false,
  checked: false,

  checkVersions: async () => {
    set({ checking: true })

    try {
      const result = await window.api.checkVersions()

      set({
        currentLauncherVersion: result.currentLauncherVersion,
        latestLauncherVersion:  result.latestLauncherVersion,
        launcherUpdateAvailable: result.launcherUpdateAvailable,
        latestGameVersions: {
          'universe':         result.latestGameVersions['universe'],
          'universe-testing': result.latestGameVersions['universe-testing']
        },
        checking: false,
        checked:  true
      })
    } catch (err) {
      console.error('[VersionStore] Échec du check de version :', err)
      set({ checking: false, checked: true })
    }
  }
}))