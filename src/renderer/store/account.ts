import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountStatus = 'connected' | 'disconnected' | 'loading'

type AccountState = {
  status: AccountStatus
  username?: string
  email?: string

  login: () => Promise<void>
  logout: () => Promise<void>
  cancelLogin: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAccountStore = create<AccountState>((set) => {
  // Subscribe to auth state changes pushed from main process
  window.api.onAuthStateChanged((data) => {
    if (data.status === 'connected') {
      set({ status: 'connected', username: data.user.username, email: data.user.email })
    } else {
      console.error('[AccountStore] Auth error:', data.error)
      // Reset to disconnected so the user can retry
      set({ status: 'disconnected', username: undefined, email: undefined })
    }
  })

  // Restore session from encrypted storage on startup
  window.api.authLoadUser().then((user) => {
    if (user) {
      set({ status: 'connected', username: user.username, email: user.email })
    }
  })

  return {
    status: 'disconnected',
    username: undefined,
    email: undefined,

    login: async () => {
      set({ status: 'loading' })
      try {
        await window.api.authLogin()
        // State will be updated by onAuthStateChanged when the callback arrives
      } catch {
        set({ status: 'disconnected' })
      }
    },

    logout: async () => {
      await window.api.authLogout()
      set({ status: 'disconnected', username: undefined, email: undefined })
    },

    cancelLogin: () => {
      set({ status: 'disconnected' })
    },
  }
})