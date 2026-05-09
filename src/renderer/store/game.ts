import { create } from 'zustand'
import { useEnvStore, type Env } from './env'
import { useFilesStore } from './files'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServerStatus = 'online' | 'offline' | 'degraded' | 'checking'

type EnvGameData = {
  serverStatus: ServerStatus
  players: number
}

type GameState = {
  data: Record<Env, EnvGameData>

  fetchServerStatus: () => Promise<void>
  play: () => Promise<void>
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const defaultEnvData: EnvGameData = {
  serverStatus: 'checking',
  players: 0
}

const defaultData: Record<Env, EnvGameData> = {
  'universe':         { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set) => ({
  data: defaultData,

  fetchServerStatus: async () => {
    const env = useEnvStore.getState().activeEnv

    set((s) => ({
      data: { ...s.data, [env]: { ...s.data[env], serverStatus: 'checking' } }
    }))

    try {
      const result = await window.api.getServerStatus(env)
      set((s) => ({
        data: {
          ...s.data,
          [env]: { serverStatus: result.status, players: result.players }
        }
      }))
    } catch {
      set((s) => ({
        data: { ...s.data, [env]: { serverStatus: 'offline', players: 0 } }
      }))
    }
  },

  play: async () => {
    const env = useEnvStore.getState().activeEnv
    const { installPath } = useFilesStore.getState().data[env]

    if (!installPath) {
      console.warn('[GameStore] Aucun répertoire d\'installation pour env :', env)
      return
    }

    try {
      await window.api.launchGame(env, installPath)
    } catch (err) {
      console.error('[GameStore] Échec du lancement :', err)
    }
  }
}))