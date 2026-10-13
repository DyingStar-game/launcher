import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import type { SocialErrorCode, SocialSnapshot } from '@shared/types/social'
import { useAccountStore } from '@stores/account'
import { useEnvStore } from '@stores/env'
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

/**
 * Friends, requests and memberships of the active environment (ADR 0007, 0025). A failed
 * refresh keeps the data on screen.
 */
export function useSocialSnapshot(): SocialSnapshotState {
  const env = useEnvStore((s) => s.activeEnv)
  const query = useQuery({
    queryKey: socialKeys.snapshot(env),
    queryFn: async () => unwrap(await window.api.socialLoad(env))
  })

  if (query.data) return { data: query.data, status: 'ready', reload: () => void query.refetch() }
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
