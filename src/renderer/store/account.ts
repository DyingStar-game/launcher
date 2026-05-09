import { create } from 'zustand'
import { useEnvStore } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = 'connected' | 'disconnected' | 'loading'

type AccountState = {
  status: AccountStatus
  username?: string

  login: () => Promise<void>
  logout: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────
// Le compte est unique (même utilisateur sur les deux envs)
// mais les endpoints d'auth peuvent différer selon l'env.

export const useAccountStore = create<AccountState>((set) => ({
  status: 'disconnected',
  username: undefined,

  login: async () => {
    const env = useEnvStore.getState().activeEnv
    set({ status: 'loading' })

    // TODO: appeler l'endpoint Discord OAuth de l'env concerné
    // const authUrl = env === 'universe'
    //   ? 'https://auth.dyingstar.com/discord'
    //   : 'https://auth-testing.dyingstar.com/discord'
    // const user = await window.api.loginWithDiscord(authUrl)
    console.log('[AccountStore] Login sur env :', env)

    await new Promise((res) => setTimeout(res, 1000))

    set({ status: 'connected', username: 'Player123' })
  },

  logout: () => {
    set({ status: 'disconnected', username: undefined })
  }
}))