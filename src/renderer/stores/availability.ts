// Disponibilité runtime de chaque env — remplace envCapabilities.ts statique.
// Déterminée au démarrage en pingant ${API_BASE}/version pour chaque env.

import { create } from 'zustand'
import type { Env } from './env'

type AvailabilityState = {
  available: Record<Env, boolean>
  checked:   boolean

  checkAvailability: () => Promise<void>
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  available: {
    'universe':         false,
    'universe-testing': false
  },
  checked: false,

  checkAvailability: async () => {
    try {
      const result = await window.api.checkEnvAvailability()
      set({ available: result, checked: true })
    } catch {
      set({ checked: true }) // en cas d'erreur, tout reste false
    }
  }
}))