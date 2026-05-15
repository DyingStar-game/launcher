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
  isMember: boolean   // ← l'API indique si l'utilisateur est déjà membre
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

  // Amis
  addFriend: (username: string) => Promise<void>
  removeFriend: (id: string) => void

  // Demandes
  acceptRequest: (id: string) => Promise<void>
  declineRequest: (id: string) => Promise<void>

  // Organisations
  joinOrga: (id: string) => Promise<void>
  createOrga: (name: string) => Promise<void>
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

// ─── Helper ───────────────────────────────────────────────────────────────────

type SetFn = (fn: (s: SocialState) => Partial<SocialState>) => void

function patchEnv(set: SetFn, env: Env, patch: Partial<EnvSocialData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSocialStore = create<SocialState>((set, get) => ({
  data: defaultData,

  // ── Chargement ─────────────────────────────────────────────────────────────

  fetchAll: async () => {
    const env = useEnvStore.getState().activeEnv

    // TODO: vrais appels API selon l'env
    // const [friends, orgas, requests] = await Promise.all([
    //   fetch(`${API_BASE[env]}/friends`).then(r => r.json()),
    //   fetch(`${API_BASE[env]}/organizations`).then(r => r.json()),  // isMember inclus
    //   fetch(`${API_BASE[env]}/friend-requests`).then(r => r.json()),
    // ])

    await new Promise((r) => setTimeout(r, 500))

    const mockData: Record<Env, EnvSocialData> = {
      'universe': {
        friends: [
          { id: '1', name: 'Aurel',  status: 'online' },
          { id: '2', name: 'Kira',   status: 'ingame', game: 'Universe' },
          { id: '3', name: 'Noah',   status: 'offline' }
        ],
        orgas: [
          { id: '1', name: 'Nova Corp',   members: 12, isMember: true  },
          { id: '2', name: 'Galaxy Team', members: 5,  isMember: false },
          { id: '3', name: 'Void Squad',  members: 8,  isMember: false }
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
          { id: '1', name: 'Test Squad', members: 3, isMember: false }
        ],
        requests: [],
        loaded: true
      }
    }

    patchEnv(set, env, mockData[env])
  },

  // ── Amis ───────────────────────────────────────────────────────────────────

  addFriend: async (username: string) => {
    const env = useEnvStore.getState().activeEnv
    const trimmed = username.trim()
    if (!trimmed) return

    // TODO: appel API
    // const res = await fetch(`${API_BASE[env]}/friend-requests`, {
    //   method: 'POST', body: JSON.stringify({ username: trimmed })
    // })
    // if (!res.ok) throw new Error('Utilisateur introuvable ou demande déjà envoyée.')

    await new Promise((r) => setTimeout(r, 600))
    console.log(`[SocialStore] Demande envoyée à "${trimmed}" sur env: ${env}`)
  },

  removeFriend: (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { friends } = get().data[env]

    // TODO: appel API DELETE /friends/:id

    patchEnv(set, env, { friends: friends.filter((f) => f.id !== id) })
  },

  // ── Demandes d'amis ────────────────────────────────────────────────────────

  acceptRequest: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { friends, requests } = get().data[env]
    const req = requests.find((r) => r.id === id)
    if (!req) return

    // TODO: appel API POST /friend-requests/:id/accept
    // await fetch(`${API_BASE[env]}/friend-requests/${id}/accept`, { method: 'POST' })

    await new Promise((r) => setTimeout(r, 400))

    patchEnv(set, env, {
      requests: requests.filter((r) => r.id !== id),
      friends: [...friends, { id: req.id, name: req.name, status: 'offline' }]
    })
  },

  declineRequest: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { requests } = get().data[env]

    // TODO: appel API POST /friend-requests/:id/decline
    // await fetch(`${API_BASE[env]}/friend-requests/${id}/decline`, { method: 'POST' })

    await new Promise((r) => setTimeout(r, 300))

    patchEnv(set, env, { requests: requests.filter((r) => r.id !== id) })
  },

  // ── Organisations ──────────────────────────────────────────────────────────

  joinOrga: async (id: string) => {
    const env = useEnvStore.getState().activeEnv
    const { orgas } = get().data[env]

    // TODO: appel API POST /organizations/:id/join
    // const res = await fetch(`${API_BASE[env]}/organizations/${id}/join`, { method: 'POST' })
    // if (!res.ok) throw new Error('Impossible de rejoindre cette organisation.')

    await new Promise((r) => setTimeout(r, 500))

    patchEnv(set, env, {
      orgas: orgas.map((o) =>
        o.id === id ? { ...o, isMember: true, members: o.members + 1 } : o
      )
    })
  },

  createOrga: async (name: string) => {
    const env = useEnvStore.getState().activeEnv
    const trimmed = name.trim()
    if (!trimmed) return

    // TODO: appel API POST /organizations
    // const res = await fetch(`${API_BASE[env]}/organizations`, {
    //   method: 'POST', body: JSON.stringify({ name: trimmed })
    // })
    // const json = await res.json()
    // if (json === false || !json.success) throw new Error('Ce nom d\'organisation est déjà pris.')

    await new Promise((r) => setTimeout(r, 600))

    // Simulation : "DyingStar" est un nom déjà pris
    if (trimmed.toLowerCase() === 'dyingstar') {
      throw new Error('Ce nom d\'organisation est déjà pris.')
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