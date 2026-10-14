import { create } from 'zustand'
import { useEnvStore, type Env } from './env'
import { useFilesStore } from './files'
import { useVersionStore } from './version'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import type { ServerStatusValue } from '@shared/types/game'

export type { ServerStatusValue }

/** How a click on Play ended: launched (or tried to), refused for an update, or ignored. */
export type PlayOutcome = 'launched' | 'updateRequired' | 'ignored'

type EnvGameData = {
  status: ServerStatusValue
  players: number
}

type GameState = {
  data: Record<Env, EnvGameData>
  /** True while a game process launched by the launcher is running. */
  gameRunning: boolean
  /** True from play click until launch IPC settles (blocks double-clicks on slow machines). */
  isLaunching: boolean
  /** Refreshes server status and player count for the active environment. */
  fetchServerStatus: () => Promise<void>
  /** Syncs running state from the main process (e.g. after failed launch). */
  syncGameRunning: () => Promise<void>
  /**
   * Launches the game executable with a fresh auth token, after checking the game version online:
   * an outdated client is not launched (ADR 0039).
   */
  play: () => Promise<PlayOutcome>
}

const defaultEnvData: EnvGameData = { status: 'unknown', players: 0 }

/**
 * Server status, player count, and game launch state per environment.
 */
export const useGameStore = create<GameState>((set, get) => {
  window.api.onGameRunningChanged((running) => {
    set({ gameRunning: running })
  })

  void window.api.isGameRunning().then((running) => {
    set({ gameRunning: running })
  })

  return {
    data: {
      universe: { ...defaultEnvData },
      'universe-testing': { ...defaultEnvData }
    },
    gameRunning: false,
    isLaunching: false,

    fetchServerStatus: async () => {
      const env = useEnvStore.getState().activeEnv

      try {
        const result = await window.api.getServerStatus(env)
        set((s) => ({
          data: {
            ...s.data,
            [env]: { status: result.status, players: result.players }
          }
        }))
      } catch {
        set((s) => ({
          data: { ...s.data, [env]: { ...s.data[env], status: 'unknown', players: 0 } }
        }))
      }
    },

    syncGameRunning: async () => {
      const running = await window.api.isGameRunning()
      set({ gameRunning: running })
    },

    play: async () => {
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
        await Promise.all([
          useVersionStore.getState().refreshGameVersions(),
          useFilesStore.getState().syncInstalledVersions()
        ])
        const { installed, version } = useFilesStore.getState().data[env]
        const latest = useVersionStore.getState().latestGameVersions[env].version
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
