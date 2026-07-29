import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChangelogEntryRef, GlobalChangelog } from '@shared/types/changelog'
import type { Env } from '@shared/types/env'
import { buildChangelogEntryRefs, unreleasedFingerprint } from '@lib/changelogEntries'
import { useEnvStore } from './env'

type ChangelogState = {
  loading: boolean
  fetched: boolean
  data: GlobalChangelog | null
  currentByEnv: Record<Env, string | null>
  viewedIds: string[]
  /**
   * Last seen unreleased content fingerprint per env/component.
   * Compared to the current component unreleased payload (not global `generated_at`).
   */
  unreleasedSeenFingerprint: Record<string, string>
  fetch: () => Promise<void>
  select: (id: string) => void
  /** Marks an entry as read without changing selection (e.g. when it is displayed). */
  markViewed: (id: string, env: Env) => void
  syncSelectionForEnv: (env: Env) => void
  getEntries: (env: Env) => ChangelogEntryRef[]
  getCurrentId: (env: Env) => string | null
  isUnread: (id: string) => boolean
  hasUnread: (env: Env) => boolean
}

type PersistedChangelog = {
  viewedIds: string[]
  unreleasedSeenFingerprint: Record<string, string>
  currentByEnv: Record<Env, string | null>
}

type PersistedChangelogV0 = {
  viewedIds?: string[]
  unreleasedSeenAt?: Record<string, string>
  unreleasedSeenFingerprint?: Record<string, string>
  currentByEnv?: Record<Env, string | null>
}

const defaultCurrentByEnv: Record<Env, string | null> = {
  universe: null,
  'universe-testing': null
}

function normalizePersistedChangelog(raw: PersistedChangelogV0): PersistedChangelog {
  return {
    viewedIds: raw.viewedIds ?? [],
    unreleasedSeenFingerprint: raw.unreleasedSeenFingerprint ?? {},
    currentByEnv: {
      ...defaultCurrentByEnv,
      ...raw.currentByEnv
    }
  }
}

function entriesForEnv(data: GlobalChangelog | null, env: Env): ChangelogEntryRef[] {
  if (!data) return []
  return buildChangelogEntryRefs(data, env)
}

function fingerprintForUnreleased(
  data: GlobalChangelog | null,
  componentId: string
): string | null {
  const component = data?.components[componentId]
  if (!component) return null
  return unreleasedFingerprint(component.unreleased)
}

function viewedPatchForEntry(
  state: {
    data: GlobalChangelog | null
    viewedIds: string[]
    unreleasedSeenFingerprint: Record<string, string>
  },
  entry: ChangelogEntryRef,
  env: Env,
  id: string
): Pick<ChangelogState, 'viewedIds' | 'unreleasedSeenFingerprint'> {
  const viewedIds = state.viewedIds.includes(id) ? state.viewedIds : [...state.viewedIds, id]
  if (entry.kind !== 'unreleased') {
    return { viewedIds, unreleasedSeenFingerprint: state.unreleasedSeenFingerprint }
  }

  const fingerprint = fingerprintForUnreleased(state.data, entry.componentId)
  const unreleasedSeenFingerprint = fingerprint
    ? { ...state.unreleasedSeenFingerprint, [`${env}:${entry.componentId}`]: fingerprint }
    : state.unreleasedSeenFingerprint

  return { viewedIds, unreleasedSeenFingerprint }
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
      unreleasedSeenFingerprint: {},

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
        const nextId = entries.some((e) => e.id === currentId)
          ? currentId
          : (entries[0]?.id ?? null)

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

        set((s) => ({
          ...viewedPatchForEntry(s, entry, env, id),
          currentByEnv: { ...s.currentByEnv, [env]: id }
        }))
      },

      markViewed: (id, env) => {
        const entry = entriesForEnv(get().data, env).find((e) => e.id === id)
        if (!entry) return

        set((s) => viewedPatchForEntry(s, entry, env, id))
      },

      isUnread: (id) => {
        const { data, viewedIds, unreleasedSeenFingerprint } = get()
        if (!data) return false

        const firstColon = id.indexOf(':')
        const lastColon = id.lastIndexOf(':')
        if (firstColon === -1 || lastColon === firstColon) return false

        const env = id.slice(0, firstColon)
        const componentId = id.slice(firstColon + 1, lastColon)
        const suffix = id.slice(lastColon + 1)
        if (!env || !componentId || !suffix) return false

        if (suffix === 'unreleased') {
          const fingerprint = fingerprintForUnreleased(data, componentId)
          if (!fingerprint) return false
          return unreleasedSeenFingerprint[`${env}:${componentId}`] !== fingerprint
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
      version: 1,
      partialize: (state) => ({
        viewedIds: state.viewedIds,
        unreleasedSeenFingerprint: state.unreleasedSeenFingerprint,
        currentByEnv: state.currentByEnv
      }),
      migrate: (persisted, version): PersistedChangelog => {
        const state = (persisted ?? {}) as PersistedChangelogV0
        if (version < 1) {
          // Drop generated_at-based markers: they fired on every JSON regen.
          // Users may see unreleased badges once until they re-open those entries.
          return normalizePersistedChangelog({
            viewedIds: state.viewedIds,
            currentByEnv: state.currentByEnv,
            unreleasedSeenFingerprint: state.unreleasedSeenFingerprint ?? {}
          })
        }
        return normalizePersistedChangelog(state)
      }
    }
  )
)

useEnvStore.subscribe((state, prev) => {
  if (state.activeEnv !== prev.activeEnv) {
    useChangelogStore.getState().syncSelectionForEnv(state.activeEnv)
  }
})
