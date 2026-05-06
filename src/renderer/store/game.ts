import { create } from 'zustand'

export type ServerStatus = 'online' | 'offline' | 'degraded'

type GameState = {
  installed: boolean
  serverStatus: ServerStatus
  players: number

  play: () => void
  fetchServerStatus: () => Promise<void>
}

export const useGameStore = create<GameState>((set) => ({
  installed: false,
  serverStatus: 'online',
  players: 0,

  play: () => {
    console.log('Launching game...')
    // 🔌 à remplacer par Electron (window.api.launchGame())
  },

  fetchServerStatus: async () => {
    // 🔌 Simulation API
    await new Promise((res) => setTimeout(res, 500))

    set({
      serverStatus: 'online',
      players: Math.floor(Math.random() * 5000)
    })
  }
}))