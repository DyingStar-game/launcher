import { create } from 'zustand'
import type {
  FriendRequestOutcome,
  JoinOutcome,
  OrganisationMembersPage,
  OrganisationProfile,
  PlayerProfile,
  PlayerSearchResult,
  SocialErrorCode,
  SocialResult,
  SocialSnapshot
} from '@shared/types/social'
import { SocialStoreError } from '@lib/socialErrors'
import { useEnvStore, type Env } from './env'

export type { Friend, FriendRequest, Organisation } from '@shared/types/social'

/** Load state of the social data for one environment. */
export type SocialStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'notSignedIn' | 'error'

type EnvSocialData = SocialSnapshot & {
  status: SocialStatus
  /** Last load error, when `status` is `error`. */
  error?: SocialErrorCode
  /** Organisation directory filter (name or ticker). */
  orgaSearch: string
}

type SocialState = {
  data: Record<Env, EnvSocialData>
  /** Loads a player's public sheet from the given env; does not touch the store. */
  getPlayer: (env: Env, playerId: string) => Promise<PlayerProfile>
  /** Loads an organisation's public sheet from the given env; does not touch the store. */
  getOrganisation: (env: Env, corporationId: string) => Promise<OrganisationProfile>
  /** Loads one page of an organisation's members (ADR 0012); does not touch the store. */
  getOrganisationMembers: (
    env: Env,
    corporationId: string,
    offset: number
  ) => Promise<OrganisationMembersPage>
  /** Loads friends, requests and organisations of the active env from `social` (ADR 0007). */
  fetchAll: () => Promise<void>
  /** Finds players by part of their name (2 characters minimum); does not touch the store. */
  searchPlayers: (query: string) => Promise<PlayerSearchResult[]>
  /** Sends a friend request; resolves to whether it was accepted at once. */
  sendFriendRequest: (playerId: string) => Promise<FriendRequestOutcome>
  removeFriend: (playerId: string) => Promise<void>
  acceptRequest: (requestId: number) => Promise<void>
  /** Declines an incoming request or cancels an outgoing one. */
  declineRequest: (requestId: number) => Promise<void>
  /** Joins an open organisation or applies to one. */
  joinOrga: (id: string) => Promise<JoinOutcome>
  createOrga: (name: string, ticker: string) => Promise<void>
  /** Filters the organisation directory and reloads. */
  searchOrgas: (search: string) => Promise<void>
}

const emptyEnvData: EnvSocialData = {
  selfId: '',
  friends: [],
  incoming: [],
  outgoing: [],
  organisations: [],
  memberOf: [],
  appliedTo: [],
  status: 'idle',
  orgaSearch: ''
}

type SetFn = (fn: (s: SocialState) => Partial<SocialState>) => void

/** Merges partial social data for one environment. */
function patchEnv(set: SetFn, env: Env, patch: Partial<EnvSocialData>): void {
  set((s) => ({
    data: { ...s.data, [env]: { ...s.data[env], ...patch } }
  }))
}

/** Load status shown for an error that prevents loading. */
function statusForError(error: SocialErrorCode): SocialStatus {
  if (error === 'unavailable') return 'unavailable'
  if (error === 'notSignedIn' || error === 'sessionExpired') return 'notSignedIn'
  return 'error'
}

/** Returns the data of a successful result, or throws its error code for the UI. */
function unwrap<T>(result: SocialResult<T>): T {
  if (!result.ok) throw new SocialStoreError(result.error)
  return result.data
}

/** Latest load per env: a slower, older response must not overwrite a newer one. */
const loadSeq: Record<Env, number> = { universe: 0, 'universe-testing': 0 }

/**
 * Social graph state per environment (friends, requests, organisations), from the `social`
 * service through main (ADR 0007). Actions apply to the active env and reload after success.
 */
export const useSocialStore = create<SocialState>((set, get) => {
  /** Reloads one env; a failed reload keeps the data already shown. */
  const load = async (env: Env): Promise<void> => {
    const seq = ++loadSeq[env]
    const current = get().data[env]
    if (current.status !== 'ready') patchEnv(set, env, { status: 'loading' })

    const result = await window.api.socialLoad(env, current.orgaSearch)
    if (seq !== loadSeq[env]) return

    if (result.ok) {
      patchEnv(set, env, { ...result.data, status: 'ready', error: undefined })
    } else if (current.status === 'ready' && statusForError(result.error) === 'error') {
      patchEnv(set, env, { error: result.error })
    } else {
      patchEnv(set, env, {
        ...emptyEnvData,
        orgaSearch: current.orgaSearch,
        status: statusForError(result.error),
        error: result.error
      })
    }
  }

  /** Runs an action on the active env, then reloads it. */
  const act = async <T>(run: (env: Env) => Promise<SocialResult<T>>): Promise<T> => {
    const env = useEnvStore.getState().activeEnv
    const data = unwrap(await run(env))
    await load(env)
    return data
  }

  return {
    data: { universe: { ...emptyEnvData }, 'universe-testing': { ...emptyEnvData } },

    getPlayer: async (env, playerId) => unwrap(await window.api.socialGetPlayer(env, playerId)),

    getOrganisation: async (env, corporationId) =>
      unwrap(await window.api.socialGetOrganisation(env, corporationId)),

    getOrganisationMembers: async (env, corporationId, offset) =>
      unwrap(await window.api.socialGetOrganisationMembers(env, corporationId, offset)),

    fetchAll: () => load(useEnvStore.getState().activeEnv),

    searchPlayers: async (query) =>
      unwrap(await window.api.socialSearchPlayers(useEnvStore.getState().activeEnv, query)),

    sendFriendRequest: (playerId) =>
      act((env) => window.api.socialSendFriendRequest(env, playerId)),

    removeFriend: (playerId) => act((env) => window.api.socialRemoveFriend(env, playerId)),

    acceptRequest: (requestId) => act((env) => window.api.socialAcceptRequest(env, requestId)),

    declineRequest: (requestId) => act((env) => window.api.socialDeclineRequest(env, requestId)),

    joinOrga: (id) => act((env) => window.api.socialJoinOrganisation(env, id)),

    createOrga: (name, ticker) =>
      act((env) => window.api.socialCreateOrganisation(env, name, ticker)),

    searchOrgas: async (search) => {
      const env = useEnvStore.getState().activeEnv
      patchEnv(set, env, { orgaSearch: search })
      await load(env)
    }
  }
})
