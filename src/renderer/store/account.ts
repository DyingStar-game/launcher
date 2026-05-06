import { create } from 'zustand'

type AccountStatus = 'connected' | 'disconnected' | 'loading'

type AccountState = {
  status: AccountStatus
  username?: string

  login: () => Promise<void>
  logout: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  status: 'disconnected',
  username: undefined,

  login: async () => {
    set({ status: 'loading' })

    // 🔌 Simulation (à remplacer par Electron + Discord OAuth)
    await new Promise((res) => setTimeout(res, 1000))
    // const user = await window.api.auth.loginWithDiscord()

    set({
      status: 'connected',
      username: 'Player123'
    })
  },

  logout: () => {
    set({
      status: 'disconnected',
      username: undefined
    })
  }
}))