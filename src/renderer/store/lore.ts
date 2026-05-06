import { create } from 'zustand'

type Article = {
  id: string
  title: string
  file: string
}

type LoreState = {
  articles: Article[]
  current?: Article

  select: (id: string) => void
}

export const useLoreStore = create<LoreState>((set, get) => ({
  articles: [
    { id: 'origins', title: 'Origines', file: 'origins.md' },
    { id: 'factions', title: 'Factions', file: 'factions.md' },
    { id: 'universe', title: 'Univers', file: 'universe.md' }
  ],

  current: undefined,

  select: (id) => {
    const article = get().articles.find((a) => a.id === id)
    set({ current: article })
  }
}))