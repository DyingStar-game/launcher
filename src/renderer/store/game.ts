import { create } from 'zustand'
import { useEnvStore, type Env } from './env'
import { useFilesStore } from './files'
import type { ServerStatusValue } from '../../main/services/gameStatus'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ServerStatusValue }

type EnvGameData = {
  status:  ServerStatusValue
  players: number
}

type GameState = {
  data: Record<Env, EnvGameData>

  fetchServerStatus: () => Promise<void>
  play: () => Promise<void>
}

const defaultEnvData: EnvGameData = { status: 'unknown', players: 0 }

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set) => ({
  data: {
    'universe':         { ...defaultEnvData },
    'universe-testing': { ...defaultEnvData }
  },

  fetchServerStatus: async () => {
    const env = useEnvStore.getState().activeEnv

    // Ne pas forcer « unknown » avant la réponse : sinon l’UI affiche « Inconnu »
    // à chaque poll jusqu’à la fin du fetch (et en continu si l’appel échoue).

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