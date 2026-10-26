import type { Env } from '@shared/types/env'
import type { SocialErrorCode, SocialResult, SocialSnapshot } from '@shared/types/social'
import { SocialStoreError } from './socialErrors'

/** Load state of the social data shown for one environment. */
export type SocialStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'notSignedIn' | 'error'

/**
 * Query keys of the social data (ADR 0025), all under `['social', env]`: an action refreshes
 * everything social of its environment, and one environment never shows another's data.
 */
export const socialKeys = {
  env: (env: Env) => ['social', env] as const,
  snapshot: (env: Env) => ['social', env, 'snapshot'] as const,
  friends: (env: Env) => ['social', env, 'friends'] as const,
  player: (env: Env, id: string) => ['social', env, 'player', id] as const,
  organisation: (env: Env, id: string) => ['social', env, 'organisation', id] as const,
  members: (env: Env, id: string) => ['social', env, 'members', id] as const,
  requests: (env: Env, id: string) => ['social', env, 'requests', id] as const,
  ranks: (env: Env, id: string) => ['social', env, 'ranks', id] as const,
  searchPlayers: (env: Env, query: string) => ['social', env, 'searchPlayers', query] as const,
  searchOrganisations: (env: Env, query: string) =>
    ['social', env, 'searchOrganisations', query] as const
}

/** Returns the data of a successful result, or throws its error code for the UI. */
export function unwrap<T>(result: SocialResult<T>): T {
  if (!result.ok) throw new SocialStoreError(result.error)
  return result.data
}

/** Error code carried by a failed social query, `unknown` for anything else. */
export function errorCode(error: unknown): SocialErrorCode {
  return error instanceof SocialStoreError ? error.code : 'unknown'
}

/** Load status shown for an error that prevents loading. */
export function statusForError(error: SocialErrorCode): SocialStatus {
  if (error === 'unavailable') return 'unavailable'
  if (error === 'notSignedIn' || error === 'sessionExpired') return 'notSignedIn'
  return 'error'
}

/** Social data before it is loaded, or when it cannot be. */
export const emptySnapshot: SocialSnapshot = {
  selfId: '',
  friends: [],
  incoming: [],
  outgoing: [],
  memberships: [],
  invitations: [],
  applications: [],
  receivedApplications: []
}
