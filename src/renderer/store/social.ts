import { create } from 'zustand'
import { useEnvStore, type Env } from './env'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FriendStatus = 'online' | 'offline' | 'ingame'

export type Friend = {
  id: string
  name: string
  status: FriendStatus
  game?: string
  avatar?: string
}

export type Orga = {
  id: string
  name: string
  members: number
}

export type FriendRequest = {
  id: string
  name: string
}

type EnvSocialData = {
  friends: Friend[]
  orgas: Orga[]
  requests: FriendRequest[]
  loaded: boolean
}

type SocialState = {
  data: Record<Env, EnvSocialData>
  fetchAll: () => Promise<void>
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

const defaultEnvData: EnvSocialData = {
  friends: [],
  orgas: [],
  requests: [],
  loaded: false
}

const defaultData: Record<Env, EnvSocialData> = {
  'universe':         { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSocialStore = create<SocialState>((set) => ({
  data: defaultData,

  fetchAll: async () => {
    const env = useEnvStore.getState().activeEnv

    // TODO: remplacer par un vrai appel API avec env en paramètre
    await new Promise((r) => setTimeout(r, 500))

    const mockData: Record<Env, EnvSocialData> = {
      'universe': {
        friends: [
          { id: '1', name: 'Aurel',  status: 'online' },
          { id: '2', name: 'Kira',   status: 'ingame', game: 'Universe' },
          { id: '3', name: 'Noah',   status: 'offline' }
        ],
        orgas: [
          { id: '1', name: 'Nova Corp',    members: 12 },
          { id: '2', name: 'Galaxy Team',  members: 5  }
        ],
        requests: [
          { id: '1', name: 'Zed'  },
          { id: '2', name: 'Mira' }
        ],
        loaded: true
      },
      'universe-testing': {
        friends: [
          { id: '1', name: 'TestUser1', status: 'online' },
          { id: '2', name: 'TestUser2', status: 'ingame', game: 'Universe Testing' }
        ],
        orgas: [
          { id: '1', name: 'Test Squad', members: 3 }
        ],
        requests: [],
        loaded: true
      }
    }

    set((s) => ({
      data: {
        ...s.data,
        [env]: mockData[env]
      }
    }))
  }
}))