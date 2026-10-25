import { create } from 'zustand'
import type { Env } from './env'

type AvailabilityState = {
  /** Whether each env API last responded successfully to `/version`. */
  available: Record<Env, boolean>
  /** Records the last answer of the availability check (`useEnvAvailability`). */
  setAvailable: (available: Record<Env, boolean>) => void
}

/**
 * Runtime availability of prod vs testing API bases, read by `useEnvAvailability` and checked
 * again until every environment answers.
 */
export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  available: {
    universe: false,
    'universe-testing': false
  },

  setAvailable: (available) => set({ available })
}))
