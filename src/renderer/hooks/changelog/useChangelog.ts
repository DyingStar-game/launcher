import { useEffect, useMemo } from 'react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { ChangelogNewMark, GlobalChangelog } from '@shared/types/changelog'
import type { Env } from '@shared/types/env'
import { useChangelogStore } from '@stores/changelog'
import { buildChangelogFeed, countNewItems, NOTHING_NEW } from '@lib/changelogEntries'
import { changelogKeys } from '@lib/changelogQueries'

/**
 * The changelog (ADR 0025, 0051): read once, again after an install; a read that fails keeps the
 * one known. Not read again on focus: it only changes with a new build.
 */
const changelogQuery = queryOptions({
  queryKey: changelogKeys.all,
  queryFn: async ({ client }): Promise<GlobalChangelog | null> =>
    (await window.api.fetchChangelog()) ??
    client.getQueryData<GlobalChangelog | null>(changelogKeys.all) ??
    null,
  staleTime: Infinity
})

export type ChangelogQuery = {
  /** Null once read when it is unavailable, and while it loads. */
  data: GlobalChangelog | null
  /** No answer yet. */
  loading: boolean
}

/** The changelog of every environment, and whether it is still loading. */
export function useChangelog(): ChangelogQuery {
  const { data, isPending } = useQuery(changelogQuery)
  return { data: data ?? null, loading: isPending }
}

/** What the player has not seen yet in `env`, as it stands now (ADR 0051). */
export function useChangelogUnreadMark(env: Env): ChangelogNewMark {
  const lastSeen = useChangelogStore((s) => s.lastSeenByEnv[env])
  const seen = useChangelogStore((s) => s.seenTimesByEnv[env])
  return useMemo(
    () => (lastSeen === null ? NOTHING_NEW : { since: lastSeen, seen }),
    [lastSeen, seen]
  )
}

/** How many entries of `env` the player has not seen yet (ADR 0051). */
export function useChangelogUnreadCount(env: Env): number {
  const { i18n } = useTranslation()
  const { data } = useChangelog()
  const mark = useChangelogUnreadMark(env)
  return useMemo(
    () => (data ? countNewItems(buildChangelogFeed(data, env, i18n.language).sections, mark) : 0),
    [data, env, i18n.language, mark]
  )
}

/** Gives a player with no reading state their starting point once the changelog is read. */
export function useChangelogReadingStart(): void {
  const { data } = useChangelog()
  const startReading = useChangelogStore((s) => s.startReading)
  useEffect(() => {
    if (data) startReading(data)
  }, [data, startReading])
}
