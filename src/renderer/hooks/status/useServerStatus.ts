import { useQuery } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import type { ServerStatusValue } from '@shared/types/game'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { STATUS_STALE_MS, StatusUnreadError, statusKeys, statusRefetchMs } from '@lib/statusQueries'

/** The game server's status and player count, as the status page last gave them. */
export type ServerStatus = { status: ServerStatusValue; players: number }

const unknownStatus: ServerStatus = { status: 'unknown', players: 0 }

/**
 * Game server status of an environment (ADR 0025, 0043), read while the environment is available:
 * reused for 30 s, read again at each poll while the game is not running (ADR 0045), and kept
 * when the status page does not answer.
 */
export function useServerStatus(env: Env): ServerStatus {
  const available = useAvailabilityStore((s) => s.available[env])
  const gameRunning = useGameStore((s) => s.gameRunning)
  const { data } = useQuery({
    queryKey: statusKeys.server(env),
    queryFn: async (): Promise<ServerStatus> => {
      const result = await window.api.getServerStatus(env)
      if (!result.reached) throw new StatusUnreadError(result.statusLabel)
      return { status: result.status, players: result.players }
    },
    enabled: available,
    staleTime: STATUS_STALE_MS,
    // Nobody looks at the launcher while playing (ADR 0045)
    refetchInterval: gameRunning ? false : statusRefetchMs()
  })
  return data ?? unknownStatus
}
