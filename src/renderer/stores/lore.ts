import { create } from 'zustand'

type Article = {
  id: string
  file: string
}

type LoreState = {
  articles: Article[]
  current?: Article
  /** Selects a lore article by id for display in LoreArticle. */
  select: (id: string) => void
}

/**
 * Lore sidebar catalog and currently selected markdown article.
 * Article titles are resolved via i18n (`lore.articles.<id>`).
 */
export const useLoreStore = create<LoreState>((set, get) => ({
  articles: [{ id: 'origins', file: 'origins.md' }],
  current: undefined,

  select: (id) => {
    const article = get().articles.find((a) => a.id === id)
    set({ current: article })
  }
}))
