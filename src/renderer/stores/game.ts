import { create } from 'zustand'
import { useEnvStore, type Env } from './env'
import { useFilesStore } from './files'
import type { ServerStatusValue } from '@shared/types/game'

export type { ServerStatusValue }

type EnvGameData = {
  status: ServerStatusValue
  players: number
}

type GameState = {
  data: Record<Env, EnvGameData>
  /** True while a game process launched by the launcher is running. */
  gameRunning: boolean
  /** Refreshes server status and player count for the active environment. */
  fetchServerStatus: () => Promise<void>
  /** Syncs running state from the main process (e.g. after failed launch). */
  syncGameRunning: () => Promise<void>
  /** Launches the game executable with a fresh auth token. */
  play: () => Promise<void>
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
      if (get().gameRunning) return

      const env = useEnvStore.getState().activeEnv
      const { installPath } = useFilesStore.getState().data[env]

      if (!installPath) {
        console.warn('[GameStore] No install path for env:', env)
        return
      }

      try {
        await window.api.launchGame(env, installPath)
        set({ gameRunning: true })
      } catch (err) {
        console.error('[GameStore] Launch failed:', err)
        await get().syncGameRunning()
      }
    }
  }
})
