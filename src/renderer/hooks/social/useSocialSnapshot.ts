import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import type { SocialErrorCode, SocialSnapshot } from '@shared/types/social'
import { useAccountStore } from '@stores/account'
import { useEnvStore } from '@stores/env'
import { useGameStore } from '@stores/game'
import {
  emptySnapshot,
  errorCode,
  socialKeys,
  statusForError,
  unwrap,
  type SocialStatus
} from '@lib/socialQueries'

/** The social data of an environment, with its load state. */
export type SocialSnapshotState = {
  /** Loaded data; empty while loading or when it cannot be loaded. */
  data: SocialSnapshot
  status: SocialStatus
  /** Error code when `status` is `error`. */
  error?: SocialErrorCode
  /** Loads again (the "Retry" button). */
  reload: () => void
}

/** A page change within this delay reuses the snapshot (ADR 0045). */
const SNAPSHOT_STALE_MS = 30_000

/** The game servers send presence about once a minute: reading it more often shows nothing new. */
const PRESENCE_REFETCH_MS = 60_000

/** Options of `useSocialSnapshot`. */
export type SocialSnapshotOptions = {
  /** Reads the friends' presence again every minute, while the game is not running (ADR 0045). */
  livePresence?: boolean
}

/**
 * Friends, requests and memberships of the active environment (ADR 0007, 0025). A failed
 * refresh keeps the data on screen. The friends come from whichever was read last: the snapshot
 * or the friends alone, which the components showing presence read every minute (ADR 0045).
 */
export function useSocialSnapshot({
  livePresence = false
}: SocialSnapshotOptions = {}): SocialSnapshotState {
  const env = useEnvStore((s) => s.activeEnv)
  const gameRunning = useGameStore((s) => s.gameRunning)
  const query = useQuery({
    queryKey: socialKeys.snapshot(env),
    queryFn: async () => unwrap(await window.api.socialLoad(env)),
    staleTime: SNAPSHOT_STALE_MS
  })
  const friends = useQuery({
    queryKey: socialKeys.friends(env),
    queryFn: async () => unwrap(await window.api.socialLoadFriends(env)),
    // Read only once the snapshot is: signed in, and not before the snapshot's own friends
    enabled: livePresence && query.isSuccess,
    staleTime: SNAPSHOT_STALE_MS,
    refetchInterval: livePresence && !gameRunning ? PRESENCE_REFETCH_MS : false
  })
  const snapshot = query.data
  const newerFriends =
    friends.data && friends.dataUpdatedAt > query.dataUpdatedAt ? friends.data : undefined
  const data = useMemo(
    () => (snapshot && newerFriends ? { ...snapshot, friends: newerFriends } : snapshot),
    [snapshot, newerFriends]
  )

  if (data) return { data, status: 'ready', reload: () => void query.refetch() }
  if (query.isError) {
    const error = errorCode(query.error)
    return {
      data: emptySnapshot,
      status: statusForError(error),
      error,
      reload: () => void query.refetch()
    }
  }
  return {
    data: emptySnapshot,
    status: query.fetchStatus === 'idle' ? 'idle' : 'loading',
    reload: () => void query.refetch()
  }
}

/**
 * Reloads an environment's social data when the player signs in or out there (ADR 0025). Signing
 * out drops it first: a failed reload keeps the data on screen, which must not show the friends
 * of the player who just left.
 */
export function useSocialAccountSync(env: Env): void {
  const queryClient = useQueryClient()
  const accountStatus = useAccountStore((s) => s.data[env].status)
  useEffect(() => {
    const queryKey = socialKeys.env(env)
    if (accountStatus === 'disconnected') void queryClient.resetQueries({ queryKey })
    else void queryClient.invalidateQueries({ queryKey })
  }, [accountStatus, env, queryClient])
}
