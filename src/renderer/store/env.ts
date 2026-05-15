import { create } from 'zustand'

export type Env = 'universe' | 'universe-testing'

interface EnvState {
  activeEnv: Env
  setEnv: (env: Env) => void
}

export const useEnvStore = create<EnvState>((set) => ({
  activeEnv: 'universe',
  setEnv: (env) => set({ activeEnv: env })
}))