import { create } from 'zustand'

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

type SocialState = {
    friends: Friend[]
    orgas: Orga[]
    requests: FriendRequest[]
  
    fetchAll: () => Promise<void>
}
  
export const useSocialStore = create<SocialState>((set) => ({
    friends: [],
    orgas: [],
    requests: [],
  
    fetchAll: async () => {
      await new Promise((r) => setTimeout(r, 500))
  
      set({
        friends: [
          { id: '1', name: 'Aurel', status: 'online' },
          { id: '2', name: 'Kira', status: 'ingame', game: 'Universe' },
          { id: '3', name: 'Noah', status: 'offline' }
        ],
        orgas: [
          { id: '1', name: 'Nova Corp', members: 12 },
          { id: '2', name: 'Galaxy Team', members: 5 }
        ],
        requests: [
          { id: '1', name: 'Zed' },
          { id: '2', name: 'Mira' }
        ]
      })
    }
}))