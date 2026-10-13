import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { Env } from '@shared/types/env'
import type {
  OrganisationSearchResult,
  PlayerSearchResult,
  SocialResult
} from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { getSocialErrorMessage } from '@lib/socialErrors'
import { socialKeys, unwrap } from '@lib/socialQueries'

/** Characters needed before searching, and delay after the last keystroke (ADR 0008, 0024). */
export const MIN_QUERY = 2
const DEBOUNCE_MS = 300

/** Where a search stands: too short to run, running, or answered. */
export type LiveSearchState<T> =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'results'; items: T[] }
  | { kind: 'error'; message: string }

/**
 * Searches while the player types (ADR 0008, 0024, 0025): from {@link MIN_QUERY} characters,
 * after a short pause; each query has its own key, so a late answer never shows for another.
 */
function useSocialSearch<T>(
  query: string,
  key: (env: Env, query: string) => readonly unknown[],
  search: (env: Env, query: string) => Promise<SocialResult<T[]>>
): LiveSearchState<T> {
  const { t } = useTranslation()
  const env = useEnvStore((s) => s.activeEnv)
  const typed = query.trim()
  const debounced = useDebouncedValue(typed, DEBOUNCE_MS)
  const result = useQuery({
    queryKey: key(env, debounced),
    queryFn: async () => unwrap(await search(env, debounced)),
    enabled: debounced.length >= MIN_QUERY
  })

  if (typed.length < MIN_QUERY) return { kind: 'idle' }
  if (debounced !== typed || result.isPending) return { kind: 'searching' }
  if (result.isError) return { kind: 'error', message: getSocialErrorMessage(result.error, t) }
  return { kind: 'results', items: result.data }
}

/** Players whose name contains the query (ADR 0008). */
export const usePlayerSearch = (query: string): LiveSearchState<PlayerSearchResult> =>
  useSocialSearch(query, socialKeys.searchPlayers, (env, q) =>
    window.api.socialSearchPlayers(env, q)
  )

/** Organisations whose name or tag contains the query (ADR 0024). */
export const useOrganisationSearch = (query: string): LiveSearchState<OrganisationSearchResult> =>
  useSocialSearch(query, socialKeys.searchOrganisations, (env, q) =>
    window.api.socialSearchOrganisations(env, q)
  )
