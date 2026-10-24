import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import type { GameVersionInfo } from '@shared/types/version'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { STATUS_STALE_MS, statusRefetchMs } from '@lib/statusQueries'
import { versionKeys } from '@lib/versionQueries'

type GameVersions = Record<Env, GameVersionInfo>

const unknownVersion: GameVersionInfo = { version: null, releaseDate: null }

/** The latest game versions, read from each universe's API (ADR 0039). */
const gameVersionsQuery = queryOptions({
  queryKey: versionKeys.game,
  // A universe whose API does not answer keeps the version known; a failed read keeps them all
  queryFn: async ({ client }): Promise<GameVersions> => {
    const latest = await window.api.checkGameVersions()
    const known = client.getQueryData<GameVersions>(versionKeys.game)
    const pick = (env: Env): GameVersionInfo =>
      latest[env].version || !known ? latest[env] : known[env]
    return { universe: pick('universe'), 'universe-testing': pick('universe-testing') }
  },
  staleTime: STATUS_STALE_MS
})

/**
 * Reads the latest game version of `env` again, as Play does before launching (ADR 0039): the
 * version known when the API does not answer, null when none is.
 */
export async function fetchLatestGameVersion(
  client: QueryClient,
  env: Env
): Promise<string | null> {
  try {
    const versions = await client.fetchQuery({ ...gameVersionsQuery, staleTime: 0 })
    return versions[env].version
  } catch (err) {
    console.warn('[GameVersions] Latest version not read:', err)
    return client.getQueryData<GameVersions>(versionKeys.game)?.[env].version ?? null
  }
}

/**
 * Latest game version of an environment (ADR 0025, 0039): read while it is available, again at
 * each poll while the game is not running (ADR 0045), so an update released during a maintenance
 * shows once it ends.
 */
export function useLatestGameVersion(env: Env): GameVersionInfo {
  const available = useAvailabilityStore((s) => s.available[env])
  const gameRunning = useGameStore((s) => s.gameRunning)
  const { data } = useQuery({
    ...gameVersionsQuery,
    enabled: available,
    refetchInterval: gameRunning ? false : statusRefetchMs()
  })
  return data?.[env] ?? unknownVersion
}
