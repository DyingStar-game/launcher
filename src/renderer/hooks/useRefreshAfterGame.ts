import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGameStore } from '@stores/game'
import { socialKeys } from '@lib/socialQueries'
import { statusKeys } from '@lib/statusQueries'
import { versionKeys } from '@lib/versionQueries'

/**
 * Reads the server statuses, the game versions and the friends' presence again when the game
 * exits: their timers stopped while it ran (ADR 0045).
 */
export function useRefreshAfterGame(): void {
  const queryClient = useQueryClient()
  const gameRunning = useGameStore((s) => s.gameRunning)
  const wasRunning = useRef(gameRunning)

  useEffect(() => {
    if (wasRunning.current && !gameRunning) {
      void queryClient.invalidateQueries({ queryKey: statusKeys.all })
      void queryClient.invalidateQueries({ queryKey: versionKeys.game })
      void queryClient.invalidateQueries({ queryKey: socialKeys.friends('universe') })
      void queryClient.invalidateQueries({ queryKey: socialKeys.friends('universe-testing') })
    }
    wasRunning.current = gameRunning
  }, [gameRunning, queryClient])
}
