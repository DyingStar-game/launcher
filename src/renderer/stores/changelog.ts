import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChangelogEntryRef, GlobalChangelog } from '@shared/types/changelog'
import type { Env } from '@shared/types/env'
import { buildChangelogEntryRefs } from '@lib/changelogEntries'
import { useEnvStore } from './env'

type ChangelogState = {
  loading: boolean
  fetched: boolean
  data: GlobalChangelog | null
  currentByEnv: Record<Env, string | null>
  viewedIds: string[]
  /** Last seen `generated_at` per env/component for unreleased unread detection. */
  unreleasedSeenAt: Record<string, string>
  fetch: () => Promise<void>
  select: (id: string) => void
  syncSelectionForEnv: (env: Env) => void
  getEntries: (env: Env) => ChangelogEntryRef[]
  getCurrentId: (env: Env) => string | null
  isUnread: (id: string) => boolean
  hasUnread: (env: Env) => boolean
}

function entriesForEnv(data: GlobalChangelog | null, env: Env): ChangelogEntryRef[] {
  if (!data) return []
  return buildChangelogEntryRefs(data, env)
}

/**
 * Remote changelog catalog, selection, and persisted read-state for notification badges.
 */
export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set, get) => ({
      loading: false,
      fetched: false,
      data: null,
      currentByEnv: {
        universe: null,
        'universe-testing': null
      },
      viewedIds: [],
      unreleasedSeenAt: {},

      getEntries: (env) => entriesForEnv(get().data, env),

      getCurrentId: (env) => get().currentByEnv[env],

      fetch: async () => {
        set({ loading: true })
        try {
          const data = await window.api.fetchChangelog()
          set({ data, fetched: true, loading: false })

          for (const env of ['universe', 'universe-testing'] as const) {
            get().syncSelectionForEnv(env)
          }
        } catch (err) {
          console.error('[ChangelogStore] Fetch failed:', err)
          set({ loading: false, fetched: true })
        }
      },

      syncSelectionForEnv: (env) => {
        const entries = entriesForEnv(get().data, env)
        const currentId = get().currentByEnv[env]
        const nextId = entries.some((e) => e.id === currentId) ? currentId : (entries[0]?.id ?? null)

        if (nextId !== currentId) {
          set((s) => ({
            currentByEnv: { ...s.currentByEnv, [env]: nextId }
          }))
        }
      },

      select: (id) => {
        const env = useEnvStore.getState().activeEnv
        const entry = entriesForEnv(get().data, env).find((e) => e.id === id)
        if (!entry) return

        set((s) => {
          const viewedIds = s.viewedIds.includes(id) ? s.viewedIds : [...s.viewedIds, id]
          const unreleasedSeenAt =
            entry.kind === 'unreleased' && s.data
              ? { ...s.unreleasedSeenAt, [`${env}:${entry.componentId}`]: s.data.generated_at }
              : s.unreleasedSeenAt
          return {
            currentByEnv: { ...s.currentByEnv, [env]: id },
            viewedIds,
            unreleasedSeenAt
          }
        })
      },

      isUnread: (id) => {
        const { data, viewedIds, unreleasedSeenAt } = get()
        if (!data) return false

        const firstColon = id.indexOf(':')
        const lastColon = id.lastIndexOf(':')
        if (firstColon === -1 || lastColon === firstColon) return false

        const env = id.slice(0, firstColon)
        const componentId = id.slice(firstColon + 1, lastColon)
        const suffix = id.slice(lastColon + 1)
        if (!env || !componentId || !suffix) return false

        if (suffix === 'unreleased') {
          return unreleasedSeenAt[`${env}:${componentId}`] !== data.generated_at
        }

        return !viewedIds.includes(id)
      },

      hasUnread: (env) => {
        const entries = entriesForEnv(get().data, env)
        return entries.some((e) => get().isUnread(e.id))
      }
    }),
    {
      name: 'dyingstar-changelog',
      partialize: (state) => ({
        viewedIds: state.viewedIds,
        unreleasedSeenAt: state.unreleasedSeenAt,
        currentByEnv: state.currentByEnv
      })
    }
  )
)

useEnvStore.subscribe((state, prev) => {
  if (state.activeEnv !== prev.activeEnv) {
    useChangelogStore.getState().syncSelectionForEnv(state.activeEnv)
  }
})
