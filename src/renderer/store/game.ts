import { create } from 'zustand'
import { useFilesStore } from './files'

type ServerStatus = 'online' | 'offline' | 'degraded' | 'checking'

type GameState = {
  serverStatus: ServerStatus
  players: number

  // Actions
  fetchServerStatus: () => Promise<void>
  play: () => Promise<void>
}

export const useGameStore = create<GameState>((set) => ({
  serverStatus: 'checking',
  players: 0,

  fetchServerStatus: async () => {
    set({ serverStatus: 'checking' })
    try {
      const result = await window.api.getServerStatus()
      set({
        serverStatus: result.status,
        players: result.players
      })
    } catch {
      set({ serverStatus: 'offline', players: 0 })
    }
  },

  play: async () => {
    const { installPath } = useFilesStore.getState()
    if (!installPath) {
      console.warn('[GameStore] Aucun répertoire d\'installation défini.')
      return
    }
    try {
      await window.api.launchGame(installPath)
    } catch (err) {
      console.error('[GameStore] Échec du lancement :', err)
    }
  }
}))