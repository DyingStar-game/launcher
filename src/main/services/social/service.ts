import type { Env } from '@shared/types/env'
import type {
  ApiCorporation,
  ApiCorporationRequest,
  ApiFriend,
  ApiFriendRequests,
  ApiMyCorporation,
  ApiPage,
  ApiProfile,
  FriendRequestOutcome,
  JoinOutcome,
  PlayerSearchResult,
  SocialResult,
  SocialSnapshot
} from '@shared/types/social'
import { socialRequest } from './client'
import { toFriend, toFriendRequest, toOrganisations, toPlayerSearchResult } from './mapping'

/** Largest page `social` serves; lists are not paginated further yet (ADR 0007). */
const PAGE = 'limit=100'

/** Results shown on the player search screen (ADR 0008). */
const SEARCH_LIMIT = 20

const id = encodeURIComponent

/**
 * Loads everything the social page shows. Starts with `GET /api/me` so the player's profile
 * exists in `social` (it is created on that first call only).
 * @param search - Organisation directory filter (name or ticker).
 */
export async function loadSocial(env: Env, search = ''): Promise<SocialResult<SocialSnapshot>> {
  const me = await socialRequest<ApiProfile>(env, 'load', 'GET', '/me')
  if (!me.ok) return me

  const [friends, requests, memberships, corporationRequests, directory] = await Promise.all([
    socialRequest<ApiPage<ApiFriend>>(env, 'load', 'GET', `/friends?${PAGE}`),
    socialRequest<ApiFriendRequests>(env, 'load', 'GET', `/friends/requests?${PAGE}`),
    socialRequest<ApiPage<ApiMyCorporation>>(env, 'load', 'GET', `/me/corporations?${PAGE}`),
    socialRequest<ApiPage<ApiCorporationRequest>>(
      env,
      'load',
      'GET',
      `/me/corporation/requests?${PAGE}`
    ),
    socialRequest<ApiPage<ApiCorporation>>(
      env,
      'load',
      'GET',
      `/corporations?${PAGE}&search=${encodeURIComponent(search.trim())}`
    )
  ])
  if (!friends.ok) return friends
  if (!requests.ok) return requests
  if (!memberships.ok) return memberships
  if (!corporationRequests.ok) return corporationRequests
  if (!directory.ok) return directory

  return {
    ok: true,
    data: {
      selfId: me.data.playerId,
      friends: friends.data.items.map(toFriend),
      incoming: requests.data.incoming.map(toFriendRequest),
      outgoing: requests.data.outgoing.map(toFriendRequest),
      organisations: toOrganisations(
        directory.data.items,
        new Set(memberships.data.items.map((m) => m.id)),
        corporationRequests.data.items
      )
    }
  }
}

/** Finds players whose display name contains `query` (ADR 0008). */
export async function searchPlayers(
  env: Env,
  query: string
): Promise<SocialResult<PlayerSearchResult[]>> {
  const search = query.trim().slice(0, 64)
  if (search.length < 2) return { ok: true, data: [] }

  const found = await socialRequest<ApiPage<ApiProfile>>(
    env,
    'searchPlayers',
    'GET',
    `/profiles?limit=${SEARCH_LIMIT}&entityType=player&search=${encodeURIComponent(search)}`
  )
  if (!found.ok) return found
  return { ok: true, data: found.data.items.map(toPlayerSearchResult) }
}

/** Sends a friend request; a pending request from that player is accepted instead. */
export async function sendFriendRequest(
  env: Env,
  playerId: string
): Promise<SocialResult<FriendRequestOutcome>> {
  const sent = await socialRequest<{ status: 'pending' | 'accepted' }>(
    env,
    'addFriend',
    'POST',
    '/friends/requests',
    { playerId }
  )
  if (!sent.ok) return sent
  return { ok: true, data: sent.data.status === 'accepted' ? 'accepted' : 'sent' }
}

/** Removes a friend. */
export function removeFriend(env: Env, playerId: string): Promise<SocialResult<void>> {
  return socialRequest<void>(env, 'removeFriend', 'DELETE', `/friends/${id(playerId)}`)
}

/** Accepts an incoming friend request. */
export async function acceptFriendRequest(
  env: Env,
  requestId: number
): Promise<SocialResult<void>> {
  const res = await socialRequest<unknown>(
    env,
    'answerRequest',
    'POST',
    `/friends/requests/${requestId}/accept`
  )
  return res.ok ? { ok: true, data: undefined } : res
}

/** Declines an incoming friend request, or cancels an outgoing one. */
export function declineFriendRequest(env: Env, requestId: number): Promise<SocialResult<void>> {
  return socialRequest<void>(env, 'answerRequest', 'POST', `/friends/requests/${requestId}/decline`)
}

/** Joins an open organisation, or applies to one that recruits on application. */
export async function joinOrganisation(
  env: Env,
  corporationId: string
): Promise<SocialResult<JoinOutcome>> {
  const res = await socialRequest<{ joined: boolean }>(
    env,
    'joinOrganisation',
    'POST',
    `/corporations/${id(corporationId)}/join`,
    {}
  )
  if (!res.ok) return res
  return { ok: true, data: res.data.joined ? 'joined' : 'applied' }
}

/** Creates an organisation; the player becomes its CEO. */
export async function createOrganisation(
  env: Env,
  name: string,
  ticker: string
): Promise<SocialResult<void>> {
  const res = await socialRequest<unknown>(env, 'createOrganisation', 'POST', '/corporations', {
    name: name.trim(),
    ticker: ticker.trim()
  })
  return res.ok ? { ok: true, data: undefined } : res
}
