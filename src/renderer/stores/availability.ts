import { create } from 'zustand'
import { useAccountStore } from './account'
import type { Env } from './env'

type AvailabilityState = {
  /** Whether each env API responded successfully to `/version` at startup. */
  available: Record<Env, boolean>
  /** Whether the status page reported each env's sign-in server up at the last check (ADR 0043). */
  authAvailable: Record<Env, boolean>
  checked: boolean
  /** Pings remote APIs, reads the sign-in servers' status, and updates availability flags. */
  checkAvailability: () => Promise<void>
  /** Reads an env's sign-in server status; restores the kept session when it is back up. */
  checkAuthAvailability: (env: Env) => Promise<void>
}

const envs: Env[] = ['universe', 'universe-testing']

/**
 * Runtime availability of prod vs testing API bases (determined at app startup), and of their
 * sign-in servers (also re-checked with each server status poll).
 */
export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  available: {
    universe: false,
    'universe-testing': false
  },
  // Optimistic until checked: a reachable server never shows unavailable on startup
  authAvailable: {
    universe: true,
    'universe-testing': true
  },
  checked: false,

  checkAvailability: async () => {
    void Promise.all(envs.map((env) => get().checkAuthAvailability(env)))
    try {
      const result = await window.api.checkEnvAvailability()
      set({ available: result, checked: true })
    } catch {
      // On failure, leave all envs as unavailable
      set({ checked: true })
    }
  },

  checkAuthAvailability: async (env) => {
    let answers: boolean
    try {
      answers = (await window.api.checkAuthAvailability(env)) === true
    } catch {
      answers = false
    }
    const wasDown = !get().authAvailable[env]
    set((s) => ({ authAvailable: { ...s.authAvailable, [env]: answers } }))
    if (answers && wasDown && useAccountStore.getState().data[env].status !== 'connected') {
      void useAccountStore.getState().restoreSession(env)
    }
  }
}))
