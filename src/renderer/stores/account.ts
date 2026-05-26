import { create } from 'zustand'
import { useEnvStore, type Env } from './env'

type AccountStatus = 'connected' | 'disconnected' | 'loading'

type EnvAccountData = {
  status: AccountStatus
  username?: string
  email?: string
  /** True after refresh failed — user must sign in again from Account panel. */
  sessionExpired?: boolean
}

type AccountState = {
  data: Record<Env, EnvAccountData>
  /** Opens OAuth login in the browser for the active environment. */
  login: () => Promise<void>
  /** Logs out and clears local session for the active environment. */
  logout: () => Promise<void>
  /** Cancels an in-progress login attempt (resets loading state). */
  cancelLogin: () => void
}

const defaultEnvData: EnvAccountData = {
  status: 'disconnected',
  username: undefined,
  email: undefined
}

const defaultData: Record<Env, EnvAccountData> = {
  universe: { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

type SetFn = (fn: (s: AccountState) => Partial<AccountState>) => void

/** Merges partial account fields for one environment into the store. */
function patchEnv(set: SetFn, env: Env, patch: Partial<EnvAccountData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

/**
 * Per-environment Discord/Keycloak auth state and login actions.
 */
export const useAccountStore = create<AccountState>((set) => {
  // Main process pushes final auth result after OAuth callback
  window.api.onAuthStateChanged((data) => {
    if (data.status === 'connected') {
      patchEnv(set, data.env, {
        status: 'connected',
        username: data.user.username,
        email: data.user.email,
        sessionExpired: false
      })
    } else if (data.status === 'disconnected') {
      patchEnv(set, data.env, {
        status: 'disconnected',
        username: undefined,
        email: undefined,
        sessionExpired: data.reason === 'session_expired'
      })
    } else {
      console.error('[AccountStore] Auth error:', data.error)
      patchEnv(set, data.env, {
        status: 'disconnected',
        username: undefined,
        email: undefined,
        sessionExpired: data.error === 'session_expired'
      })
    }
  })

  // Restore persisted sessions on startup (one request per env)
  const envs: Env[] = ['universe', 'universe-testing']
  envs.forEach((env) => {
    window.api.authLoadUser(env).then((user) => {
      if (user) {
        patchEnv(set, env, {
          status: 'connected',
          username: user.username,
          email: user.email,
          sessionExpired: false
        })
      }
    })
  })

  return {
    data: defaultData,

    login: async () => {
      const env = useEnvStore.getState().activeEnv
      patchEnv(set, env, { status: 'loading' })
      try {
        await window.api.authLogin(env)
        // Connected state is applied via onAuthStateChanged
      } catch {
        patchEnv(set, env, { status: 'disconnected' })
      }
    },

    logout: async () => {
      const env = useEnvStore.getState().activeEnv
      await window.api.authLogout(env)
      patchEnv(set, env, {
        status: 'disconnected',
        username: undefined,
        email: undefined,
        sessionExpired: false
      })
    },

    cancelLogin: () => {
      const env = useEnvStore.getState().activeEnv
      patchEnv(set, env, { status: 'disconnected' })
    }
  }
})
