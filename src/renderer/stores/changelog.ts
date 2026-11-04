import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChangelogNewMark, GlobalChangelog } from '@shared/types/changelog'
import type { Env } from '@shared/types/env'
import {
  buildChangelogFeed,
  initialLastSeen,
  newestPublication,
  publicationTimes
} from '@lib/changelogEntries'

const ENVS = ['universe', 'universe-testing'] as const

type ChangelogState = {
  /** Everything published up to this time is seen, per universe; null before any data (ADR 0051). */
  lastSeenByEnv: Record<Env, number | null>
  /** Publications seen after that date, until they all are and the date moves (ADR 0051). */
  seenTimesByEnv: Record<Env, number[]>
  /** Where the feed's "new since the last visit" mark sits, for this launch only (ADR 0051). */
  shownMarkByEnv: Partial<Record<Env, ChangelogNewMark>>
  /** Gives a player with no reading state their starting point: only the newest counts as new. */
  startReading: (data: GlobalChangelog) => void
  /** The player opens a universe's feed: sets the mark, once per launch. */
  openFeed: (env: Env, data: GlobalChangelog) => void
  /** These publications are on screen; the date moves once every publication is seen. */
  markSeen: (env: Env, times: number[], data: GlobalChangelog) => void
  /** Everything published in the universe is seen, the mark staying on screen (ADR 0046). */
  markAllSeen: (env: Env, data: GlobalChangelog) => void
}

/** What is kept between launches: what was seen, not the mark (ADR 0051). */
type PersistedChangelog = Pick<ChangelogState, 'lastSeenByEnv' | 'seenTimesByEnv'>

const NOTHING_SEEN: PersistedChangelog = {
  lastSeenByEnv: { universe: null, 'universe-testing': null },
  seenTimesByEnv: { universe: [], 'universe-testing': [] }
}

/**
 * What the player has seen of the changelog (ADR 0051); the changelog itself is a query
 * (`useChangelog`, ADR 0025).
 */
export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set, get) => ({
      ...NOTHING_SEEN,
      shownMarkByEnv: {},

      startReading: (data) => {
        const lastSeenByEnv = { ...get().lastSeenByEnv }
        for (const env of ENVS) {
          lastSeenByEnv[env] ??= initialLastSeen(buildChangelogFeed(data, env, 'en'))
        }
        set({ lastSeenByEnv })
      },

      openFeed: (env, data) => {
        const { lastSeenByEnv, seenTimesByEnv, shownMarkByEnv } = get()
        if (shownMarkByEnv[env]) return
        const feed = buildChangelogFeed(data, env, 'en')
        // The page can open before the starting point is set
        const since = lastSeenByEnv[env] ?? initialLastSeen(feed)
        if (since === null) return
        set({
          lastSeenByEnv: { ...lastSeenByEnv, [env]: since },
          shownMarkByEnv: { ...shownMarkByEnv, [env]: { since, seen: seenTimesByEnv[env] } }
        })
      },

      markSeen: (env, times, data) => {
        const { lastSeenByEnv, seenTimesByEnv } = get()
        const lastSeen = lastSeenByEnv[env]
        if (lastSeen === null) return
        const seen = new Set(seenTimesByEnv[env])
        const fresh = times.filter((time) => time > lastSeen && !seen.has(time))
        if (fresh.length === 0) return

        for (const time of fresh) seen.add(time)
        const published = publicationTimes(buildChangelogFeed(data, env, 'en'))
        if (published.every((time) => time <= lastSeen || seen.has(time))) {
          get().markAllSeen(env, data)
        } else {
          set({ seenTimesByEnv: { ...seenTimesByEnv, [env]: [...seen] } })
        }
      },

      markAllSeen: (env, data) => {
        const newest = newestPublication(buildChangelogFeed(data, env, 'en'))
        if (newest === null) return
        const { lastSeenByEnv, seenTimesByEnv } = get()
        set({
          lastSeenByEnv: { ...lastSeenByEnv, [env]: newest },
          seenTimesByEnv: { ...seenTimesByEnv, [env]: [] }
        })
      }
    }),
    {
      name: 'dyingstar-changelog',
      // Version 3: one date per universe replaces the read state per version, which cannot be
      // converted; the newest publication counts as new once (ADR 0051)
      version: 3,
      partialize: (state): PersistedChangelog => ({
        lastSeenByEnv: state.lastSeenByEnv,
        seenTimesByEnv: state.seenTimesByEnv
      }),
      migrate: (persisted, version): PersistedChangelog =>
        version < 3 || !persisted ? NOTHING_SEEN : (persisted as PersistedChangelog)
    }
  )
)
