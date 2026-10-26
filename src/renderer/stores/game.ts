import { create } from 'zustand'
import { useEnvStore } from './env'
import { useFilesStore } from './files'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'

/** How a click on Play ended: launched (or tried to), refused for an update, or ignored. */
export type PlayOutcome = 'launched' | 'updateRequired' | 'ignored'

type GameState = {
  /** True while a game process launched by the launcher is running. */
  gameRunning: boolean
  /** True from play click until launch IPC settles (blocks double-clicks on slow machines). */
  isLaunching: boolean
  /** Syncs running state from the main process (e.g. after failed launch). */
  syncGameRunning: () => Promise<void>
  /**
   * Launches the game executable with a fresh auth token, after reading the latest game version
   * again (`readLatestVersion`, a query read by the caller): an outdated client is not launched
   * (ADR 0039).
   */
  play: (readLatestVersion: () => Promise<string | null>) => Promise<PlayOutcome>
}

/**
 * Game launch state; the server status is a query (`useServerStatus`, ADR 0025).
 */
export const useGameStore = create<GameState>((set, get) => {
  window.api.onGameRunningChanged((running) => {
    set({ gameRunning: running })
  })

  void window.api.isGameRunning().then((running) => {
    set({ gameRunning: running })
  })

  return {
    gameRunning: false,
    isLaunching: false,

    syncGameRunning: async () => {
      const running = await window.api.isGameRunning()
      set({ gameRunning: running })
    },

    play: async (readLatestVersion) => {
      if (get().gameRunning || get().isLaunching) return 'ignored'

      const env = useEnvStore.getState().activeEnv
      const { installPath } = useFilesStore.getState().data[env]

      if (!installPath) {
        console.warn('[GameStore] No install path for env:', env)
        return 'ignored'
      }

      set({ isLaunching: true })
      try {
        // The online version and the installed one (version.json), both read again: a version
        // released since the last poll is installed before playing (ADR 0039)
        const [latest] = await Promise.all([
          readLatestVersion(),
          useFilesStore.getState().syncInstalledVersions()
        ])
        const { installed, version } = useFilesStore.getState().data[env]
        if (isGameUpdateAvailable(installed, version, latest)) return 'updateRequired'
        await window.api.launchGame(env, installPath)
      } catch (err) {
        console.error('[GameStore] Launch failed:', err)
      } finally {
        // Source of truth is the main-process PID watch (handles instant crash / failed spawn).
        set({ isLaunching: false })
        await get().syncGameRunning()
      }
      return 'launched'
    }
  }
})
