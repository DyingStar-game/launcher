import { create } from 'zustand'
import { useEnvStore, type Env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = 'connected' | 'disconnected' | 'loading'

type EnvAccountData = {
  status:    AccountStatus
  username?: string
  email?:    string
}

type AccountState = {
  data: Record<Env, EnvAccountData>

  login:       () => Promise<void>
  logout:      () => Promise<void>
  cancelLogin: () => void
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const defaultEnvData: EnvAccountData = {
  status:    'disconnected',
  username:  undefined,
  email:     undefined
}

const defaultData: Record<Env, EnvAccountData> = {
  'universe':         { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

type SetFn = (fn: (s: AccountState) => Partial<AccountState>) => void

function patchEnv(set: SetFn, env: Env, patch: Partial<EnvAccountData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAccountStore = create<AccountState>((set) => {

  // Écoute les changements d'état auth envoyés depuis le main process.
  // Le payload inclut maintenant l'env pour mettre à jour le bon slot.
  window.api.onAuthStateChanged((data) => {
    if (data.status === 'connected') {
      patchEnv(set, data.env, {
        status:   'connected',
        username: data.user.username,
        email:    data.user.email
      })
    } else {
      console.error('[AccountStore] Auth error:', data.error)
      patchEnv(set, data.env, {
        status:   'disconnected',
        username: undefined,
        email:    undefined
      })
    }
  })

  // Restauration de session au démarrage — pour chaque env séparément
  const envs: Env[] = ['universe', 'universe-testing']
  envs.forEach((env) => {
    window.api.authLoadUser(env).then((user) => {
      if (user) {
        patchEnv(set, env, {
          status:   'connected',
          username: user.username,
          email:    user.email
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
        // La mise à jour finale arrive via onAuthStateChanged
      } catch {
        patchEnv(set, env, { status: 'disconnected' })
      }
    },

    logout: async () => {
      const env = useEnvStore.getState().activeEnv
      await window.api.authLogout(env)
      patchEnv(set, env, { status: 'disconnected', username: undefined, email: undefined })
    },

    cancelLogin: () => {
      const env = useEnvStore.getState().activeEnv
      patchEnv(set, env, { status: 'disconnected' })
    }
  }
})