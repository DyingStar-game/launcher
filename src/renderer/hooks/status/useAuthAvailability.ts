import { useQuery } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { STATUS_STALE_MS, StatusUnreadError, statusKeys, statusRefetchMs } from '@lib/statusQueries'

/**
 * Whether an environment's sign-in server is up (ADR 0043), read like the game server status (ADR
 * 0025). True until the status page says otherwise: an unanswered read does not block sign-in.
 * When it comes back up, the session kept on disk is restored, once per read.
 */
export function useAuthAvailability(env: Env): boolean {
  const available = useAvailabilityStore((s) => s.available[env])
  const gameRunning = useGameStore((s) => s.gameRunning)
  const { data } = useQuery({
    queryKey: statusKeys.auth(env),
    queryFn: async ({ client, queryKey }): Promise<boolean> => {
      const up = await window.api.checkAuthAvailability(env)
      if (up === null) throw new StatusUnreadError('auth')
      const wasDown = client.getQueryData<boolean>(queryKey) === false
      if (up && wasDown && useAccountStore.getState().data[env].status !== 'connected') {
        void useAccountStore.getState().restoreSession(env)
      }
      return up
    },
    enabled: available,
    staleTime: STATUS_STALE_MS,
    // Nobody looks at the launcher while playing (ADR 0045)
    refetchInterval: gameRunning ? false : statusRefetchMs()
  })
  return data ?? true
}
