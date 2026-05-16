import { create } from 'zustand'
import { useEnvStore, type Env } from './env'
import { SOCIAL_ERROR, SocialStoreError } from '@lib/socialErrors'

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
  /** Whether the current user is already a member (from API). */
  isMember: boolean
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
  /** Loads friends, orgs, and requests for the active env (mock until API wired). */
  fetchAll: () => Promise<void>
  addFriend: (username: string) => Promise<void>
  removeFriend: (id: string) => void
  acceptRequest: (id: string) => Promise<void>
  declineRequest: (id: string) => Promise<void>
  joinOrga: (id: string) => Promise<void>
  createOrga: (name: string) => Promise<void>
}

const defaultEnvData: EnvSocialData = {
  friends: [],
  orgas: [],
  requests: [],
  loaded: false
}

const defaultData: Record<Env, EnvSocialData> = {
  universe: { ...defaultEnvData },
  'universe-testing': { ...defaultEnvData }
}

type SetFn = (fn: (s: SocialState) => Partial<SocialState>) => void

/** Merges partial social data for one environment. */
function patchEnv(set: SetFn, env: Env, patch: Partial<EnvSocialData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

/**
 * Social graph state per environment (friends, orgs, requests).
 * Currently backed by mock data; replace with API calls when available.
 */
export const useSocialStore = create<SocialState>((set, get) => ({
  data: defaultData,

  fetchAll: async () => {
    const env = useEnvStore.getState().activeEnv

    // TODO: replace with real API calls per env
    await new Promise((r) => setTimeout(r, 500))

    const mockData: Record<Env, EnvSocialData> = {
      universe: {
        friends: [
          { id: '1', name: 'Aurel', status: 'online' },
          { id: '2', name: 'Kira', status: 'ingame', game: 'Universe' },
          { id: '3', name: 'Noah', status: 'offline' }
        ],
        orgas: [
          { id: '1', name: 'Nova Corp', members: 12, isMember: true },
          { id: '2', name: 'Galaxy Team', members: 5, isMember: false },
          { id: '3', name: 'Void Squad', members: 8, isMember: false }
        ],
        requests: [
          { id: '1', name: 'Zed' },
          { id: '2', name: 'Mira' }
        ],
        loaded: true
      },
      'universe-testing': {
        friends: [
          { id: '1', name: 'TestUser1', status: 'online' },
          { id: '2', name: 'TestUser2', status: 'ingame', game: 'Universe Testing' }
        ],
        orgas: [{ id: '1', name: 'Test Squad', members: 3, isMember: false }],
        requests: [],
        loaded: true
      }
    }

    patchEnv(set, env, mockData[env])
  },

  addFriend: async (username: string) => {
    const env = useEnvStore.getState().activeEnv
    const trimmed = username.trim()
    if (!trimmed) return

    const { friends, requests } = get().data[env]
    const nameTaken =
      friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase()) ||
      requests.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())

    // TODO: POST friend request API
    await new Promise((r) => setTimeout(r, 600))

    if (nameTaken) {
      throw new SocialStoreError(SOCIAL_ERROR.FRIEND_REQUEST_FAILED)
    }

    console.log(`[SocialStore] Friend request sent to "${trimmed}" on env:`, env)
  },

  removeFriend: (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { friends } = get().data[env]
    // TODO: DELETE /friends/:id
    patchEnv(set, env, { friends: friends.filter((f) => f.id !== id) })
  },

  acceptRequest: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { friends, requests } = get().data[env]
    const req = requests.find((r) => r.id === id)
    if (!req) return

    // TODO: POST /friend-requests/:id/accept
    await new Promise((r) => setTimeout(r, 400))

    patchEnv(set, env, {
      requests: requests.filter((r) => r.id !== id),
      friends: [...friends, { id: req.id, name: req.name, status: 'offline' }]
    })
  },

  declineRequest: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { requests } = get().data[env]

    // TODO: POST /friend-requests/:id/decline
    await new Promise((r) => setTimeout(r, 300))

    patchEnv(set, env, { requests: requests.filter((r) => r.id !== id) })
  },

  joinOrga: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { orgas } = get().data[env]

    // TODO: POST /organizations/:id/join
    await new Promise((r) => setTimeout(r, 500))

    patchEnv(set, env, {
      orgas: orgas.map((o) => (o.id === id ? { ...o, isMember: true, members: o.members + 1 } : o))
    })
  },

  createOrga: async (name: string) => {
    const env = useEnvStore.getState().activeEnv
    const trimmed = name.trim()
    if (!trimmed) return

    // TODO: POST /organizations
    await new Promise((r) => setTimeout(r, 600))

    if (trimmed.toLowerCase() === 'dyingstar') {
      throw new SocialStoreError(SOCIAL_ERROR.ORGA_NAME_TAKEN)
    }

    const { orgas } = get().data[env]
    const newOrga: Orga = {
      id: `orga-${Date.now()}`,
      name: trimmed,
      members: 1,
      isMember: true
    }

    patchEnv(set, env, { orgas: [...orgas, newOrga] })
  }
}))
