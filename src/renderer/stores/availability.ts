import { create } from 'zustand'
import type { Env } from './env'

type AvailabilityState = {
  /** Whether each env API responded successfully to `/version` at startup. */
  available: Record<Env, boolean>
  checked: boolean
  /** Pings remote APIs and updates availability flags. */
  checkAvailability: () => Promise<void>
}

/**
 * Runtime availability of prod vs testing API bases (determined at app startup).
 */
export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  available: {
    universe: false,
    'universe-testing': false
  },
  checked: false,

  checkAvailability: async () => {
    try {
      const result = await window.api.checkEnvAvailability()
      set({ available: result, checked: true })
    } catch {
      // On failure, leave all envs as unavailable
      set({ checked: true })
    }
  }
}))
