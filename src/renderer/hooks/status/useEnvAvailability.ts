import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { AVAILABILITY_RETRY_MS, statusKeys } from '@lib/statusQueries'

/** True when every environment answered. */
function allAvailable(available: Record<Env, boolean> | undefined): boolean {
  return available !== undefined && Object.values(available).every(Boolean)
}

/**
 * Checks which environments' APIs answer (ADR 0025) and records it in the availability store:
 * checked again when the network comes back, and every 30 s while one does not answer, except
 * while the game runs (ADR 0045).
 */
export function useEnvAvailability(): void {
  const setAvailable = useAvailabilityStore((s) => s.setAvailable)
  const gameRunning = useGameStore((s) => s.gameRunning)
  const { data } = useQuery({
    queryKey: statusKeys.availability,
    queryFn: () => window.api.checkEnvAvailability(),
    refetchInterval: (query) =>
      gameRunning || allAvailable(query.state.data) ? false : AVAILABILITY_RETRY_MS
  })

  useEffect(() => {
    if (data) setAvailable(data)
  }, [data, setAvailable])
}
