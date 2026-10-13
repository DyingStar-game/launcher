import { create } from 'zustand'
import type { Env } from '@shared/types/env'

export type { Env } from '@shared/types/env'

interface EnvState {
  activeEnv: Env
  /** Switches the active universe (prod vs testing) for all env-scoped stores. */
  setEnv: (env: Env) => void
}

/**
 * Tracks which game environment (universe / universe-testing) the UI operates on; the launcher
 * opens on Universe Testing.
 */
export const useEnvStore = create<EnvState>((set) => ({
  activeEnv: 'universe-testing',
  setEnv: (env) => set({ activeEnv: env })
}))
