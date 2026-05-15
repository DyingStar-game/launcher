import { create } from 'zustand'
import type { Env } from '@shared/types/env'

export type { Env } from '@shared/types/env'

interface EnvState {
  activeEnv: Env
  setEnv: (env: Env) => void
}

export const useEnvStore = create<EnvState>((set) => ({
  activeEnv: 'universe',
  setEnv: (env) => set({ activeEnv: env })
}))