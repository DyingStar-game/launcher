import type { Env } from '@shared/types/env'
import type {
  ApiCorporation,
  ApiCorporationMember,
  ApiCorporationPage,
  ApiCorporationRequest,
  ApiCorporationRequestView,
  ApiFriend,
  ApiFriendRequests,
  ApiMyCorporation,
  ApiPage,
  ApiProfile,
  ApiPublicProfile,
  ApiRank,
  Friend,
  FriendRequestOutcome,
  InviteOutcome,
  JoinOutcome,
  OrganisationApplications,
  OrganisationMembersPage,
  OrganisationPendingRequest,
  OrganisationRank,
  OrganisationProfile,
  OrganisationRequest,
  OrganisationSearchResult,
  PlayerProfile,
  PlayerSearchResult,
  SocialResult,
  SocialSnapshot
} from '@shared/types/social'
import { can } from '@shared/organisationRights'
import {
  createOrganisationSchema,
  organisationPatchSchema,
  profilePatchSchema,
  rankInputSchema
} from '@shared/schemas/social'
import { socialRequest } from './client'
import {
  parseInput,
  toFriend,
  toFriendRequest,
  toMembership,
  toOrganisationMember,
  toOrganisationPendingRequest,
  toOrganisationRank,
  toOrganisationProfile,
  toOrganisationRequest,
  toOrganisationSearchResult,
  toPlayerProfile,
  toPlayerSearchResult,
  toReceivedApplication
} from './mapping'

/** Largest page `social` serves; lists are not paginated further yet (ADR 0007). */
const PAGE = 'limit=100'

/** Results shown on the player and organisation search screens (ADR 0008, 0024). */
const SEARCH_LIMIT = 20

const id = encodeURIComponent

/**
 * Loads everything the social page shows. Starts with `GET /api/me` so the player's profile
 * exists in `social` (it is created on that first call only).
 */
export async function loadSocial(env: Env): Promise<SocialResult<SocialSnapshot>> {
  const me = await socialRequest<ApiProfile>(env, 'load', 'GET', '/me')
  if (!me.ok) return me

  const [friends, requests, memberships, corporationRequests] = await Promise.all([
    socialRequest<ApiPage<ApiFriend>>(env, 'load', 'GET', `/friends?${PAGE}`),
    socialRequest<ApiFriendRequests>(env, 'load', 'GET', `/friends/requests?${PAGE}`),
    socialRequest<ApiPage<ApiMyCorporation>>(env, 'load', 'GET', `/me/corporations?${PAGE}`),
    socialRequest<ApiPage<ApiCorporationRequest>>(
      env,
      'load',
      'GET',
      `/me/corporation/requests?${PAGE}`
    )
  ])
  if (!friends.ok) return friends
  if (!requests.ok) return requests
  if (!memberships.ok) return memberships
  if (!corporationRequests.ok) return corporationRequests

  const received = await loadReceivedApplications(env, memberships.data.items)
  if (!received.ok) return received

  const requestsOf = (kind: ApiCorporationRequest['kind']): OrganisationRequest[] =>
    corporationRequests.data.items.filter((r) => r.kind === kind).map(toOrganisationRequest)

  return {
    ok: true,
    data: {
      selfId: me.data.playerId,
      friends: friends.data.items.map(toFriend),
      incoming: requests.data.incoming.map(toFriendRequest),
      outgoing: requests.data.outgoing.map(toFriendRequest),
      memberships: memberships.data.items.map(toMembership),
      invitations: requestsOf('invitation'),
      applications: requestsOf('application'),
      receivedApplications: received.data
    }
  }
}

/** Pending applications of each organisation whose rank lets the player recruit (ADR 0024). */
/** Loads the friends alone, with their presence: refreshed every minute (ADR 0045). */
export async function loadFriends(env: Env): Promise<SocialResult<Friend[]>> {
  const friends = await socialRequest<ApiPage<ApiFriend>>(env, 'load', 'GET', `/friends?${PAGE}`)
  if (!friends.ok) return friends
  return { ok: true, data: friends.data.items.map(toFriend) }
}

async function loadReceivedApplications(
  env: Env,
  memberships: ApiMyCorporation[]
): Promise<SocialResult<OrganisationApplications[]>> {
  const recruiting = memberships.filter((m) => can(m.rank, 'recruit'))
  const pages = await Promise.all(
    recruiting.map((m) =>
      socialRequest<ApiPage<ApiCorporationRequestView>>(
        env,
        'load',
        'GET',
        `/corporations/${id(m.id)}/requests?${PAGE}`
      )
    )
  )
  const groups: OrganisationApplications[] = []
  for (const [i, page] of pages.entries()) {
    if (!page.ok) return page
    const { id: orgId, name, ticker } = recruiting[i]
    const applications = page.data.items
      .filter((r) => r.kind === 'application')
      .map(toReceivedApplication)
    if (applications.length > 0) {
      groups.push({ organisation: { id: orgId, name, ticker }, applications })
    }
  }
  return { ok: true, data: groups }
}

/** Finds organisations whose name or tag contains `query` (ADR 0024). */
export async function searchOrganisations(
  env: Env,
  query: string
): Promise<SocialResult<OrganisationSearchResult[]>> {
  const search = query.trim().slice(0, 64)
  if (search.length < 2) return { ok: true, data: [] }

  const found = await socialRequest<ApiPage<ApiCorporation>>(
    env,
    'searchOrganisations',
    'GET',
    `/corporations?limit=${SEARCH_LIMIT}&search=${encodeURIComponent(search)}`
  )
  if (!found.ok) return found
  return { ok: true, data: found.data.items.map(toOrganisationSearchResult) }
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

/** Loads a player's public sheet (ADR 0009). */
export async function getPlayer(env: Env, playerId: string): Promise<SocialResult<PlayerProfile>> {
  const res = await socialRequest<ApiPublicProfile>(
    env,
    'viewPlayer',
    'GET',
    `/profiles/${id(playerId)}`
  )
  if (!res.ok) return res
  return { ok: true, data: toPlayerProfile(res.data) }
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

/** Loads an organisation's public sheet (ADR 0010). */
export async function getOrganisation(
  env: Env,
  corporationId: string
): Promise<SocialResult<OrganisationProfile>> {
  const res = await socialRequest<ApiCorporationPage>(
    env,
    'viewOrganisation',
    'GET',
    `/corporations/${id(corporationId)}`
  )
  if (!res.ok) return res
  return { ok: true, data: toOrganisationProfile(res.data) }
}

/** Members shown per "Load more" on the organisation page (ADR 0012). */
const MEMBERS_PAGE = 50

/** One page of an organisation's members, highest rank first (ADR 0012). */
export async function getOrganisationMembers(
  env: Env,
  corporationId: string,
  offset: number
): Promise<SocialResult<OrganisationMembersPage>> {
  const res = await socialRequest<ApiPage<ApiCorporationMember>>(
    env,
    'viewOrganisation',
    'GET',
    `/corporations/${id(corporationId)}/members?limit=${MEMBERS_PAGE}&offset=${Math.max(0, Math.floor(offset))}`
  )
  if (!res.ok) return res
  return {
    ok: true,
    data: { members: res.data.items.map(toOrganisationMember), total: res.data.total }
  }
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
export async function createOrganisation(env: Env, input: unknown): Promise<SocialResult<void>> {
  const body = parseInput(createOrganisationSchema, input)
  if (!body.ok) return body
  const res = await socialRequest<unknown>(
    env,
    'createOrganisation',
    'POST',
    '/corporations',
    body.data
  )
  return res.ok ? { ok: true, data: undefined } : res
}

/**
 * Answers an organisation request as the player: accepts or declines an invitation, or
 * withdraws an application (`accept` false).
 */
export async function answerOrganisationInvitation(
  env: Env,
  requestId: number,
  accept: boolean
): Promise<SocialResult<void>> {
  const res = await socialRequest<unknown>(
    env,
    'answerInvitation',
    'POST',
    `/me/corporation/requests/${requestId}/${accept ? 'accept' : 'decline'}`
  )
  return res.ok ? { ok: true, data: undefined } : res
}

/** Accepts or declines an application received by an organisation (ADR 0024). */
export async function answerOrganisationRequest(
  env: Env,
  corporationId: string,
  requestId: number,
  accept: boolean
): Promise<SocialResult<void>> {
  const res = await socialRequest<unknown>(
    env,
    'answerApplication',
    'POST',
    `/corporations/${id(corporationId)}/requests/${requestId}/${accept ? 'accept' : 'decline'}`
  )
  return res.ok ? { ok: true, data: undefined } : res
}

/** Updates the player's own profile texts (ADR 0020); only the fields given change. */
export async function updateProfile(env: Env, input: unknown): Promise<SocialResult<void>> {
  const patch = parseInput(profilePatchSchema, input)
  if (!patch.ok) return patch
  const res = await socialRequest<unknown>(env, 'updateProfile', 'PATCH', '/me', patch.data)
  return res.ok ? { ok: true, data: undefined } : res
}

/** A request with no answer body: success or the error code. */
async function act(
  env: Env,
  action: Parameters<typeof socialRequest>[1],
  method: Parameters<typeof socialRequest>[2],
  path: string,
  body?: unknown
): Promise<SocialResult<void>> {
  const res = await socialRequest<unknown>(env, action, method, path, body)
  return res.ok ? { ok: true, data: undefined } : res
}

const corporation = (corporationId: string): string => `/corporations/${id(corporationId)}`

/** Edits an organisation's details (ADR 0021): changed fields only. */
export async function updateOrganisation(
  env: Env,
  corporationId: string,
  input: unknown
): Promise<SocialResult<void>> {
  const patch = parseInput(organisationPatchSchema, input)
  if (!patch.ok) return patch
  return act(env, 'updateOrganisation', 'PATCH', corporation(corporationId), patch.data)
}

/** Pending applications and invitations of an organisation, for its managers (ADR 0021). */
export async function getOrganisationRequests(
  env: Env,
  corporationId: string
): Promise<SocialResult<OrganisationPendingRequest[]>> {
  const res = await socialRequest<ApiPage<ApiCorporationRequestView>>(
    env,
    'viewRequests',
    'GET',
    `${corporation(corporationId)}/requests?${PAGE}`
  )
  if (!res.ok) return res
  return { ok: true, data: res.data.items.map(toOrganisationPendingRequest) }
}

/** Invites a player; a pending application from them is accepted instead. */
export async function inviteToOrganisation(
  env: Env,
  corporationId: string,
  playerId: string
): Promise<SocialResult<InviteOutcome>> {
  const res = await socialRequest<{ joined: boolean }>(
    env,
    'invite',
    'POST',
    `${corporation(corporationId)}/invitations`,
    { playerId }
  )
  if (!res.ok) return res
  return { ok: true, data: res.data.joined ? 'joined' : 'invited' }
}

/** Gives a member another rank (strictly below the caller's, never the CEO's). */
export function setMemberRank(
  env: Env,
  corporationId: string,
  playerId: string,
  rankId: number
): Promise<SocialResult<void>> {
  return act(
    env,
    'manageMembers',
    'PATCH',
    `${corporation(corporationId)}/members/${id(playerId)}`,
    {
      rankId
    }
  )
}

/** Removes a member, or leaves when `playerId` is the player's own. */
export function removeMember(
  env: Env,
  corporationId: string,
  playerId: string
): Promise<SocialResult<void>> {
  return act(
    env,
    'manageMembers',
    'DELETE',
    `${corporation(corporationId)}/members/${id(playerId)}`
  )
}

/** An organisation's ranks, highest first. */
export async function getOrganisationRanks(
  env: Env,
  corporationId: string
): Promise<SocialResult<OrganisationRank[]>> {
  const res = await socialRequest<ApiRank[]>(
    env,
    'manageRanks',
    'GET',
    `${corporation(corporationId)}/ranks`
  )
  if (!res.ok) return res
  return { ok: true, data: res.data.map(toOrganisationRank) }
}

/** Creates a rank (name, priority, permissions, default). */
export async function createRank(
  env: Env,
  corporationId: string,
  input: unknown
): Promise<SocialResult<void>> {
  const rank = parseInput(rankInputSchema, input)
  if (!rank.ok) return rank
  return act(env, 'manageRanks', 'POST', `${corporation(corporationId)}/ranks`, rank.data)
}

/** Edits a rank: the fields given only. */
export async function updateRank(
  env: Env,
  corporationId: string,
  rankId: number,
  input: unknown
): Promise<SocialResult<void>> {
  const rank = parseInput(rankInputSchema, input)
  if (!rank.ok) return rank
  return act(
    env,
    'manageRanks',
    'PATCH',
    `${corporation(corporationId)}/ranks/${rankId}`,
    rank.data
  )
}

/** Deletes a rank; its members get the default rank. */
export function deleteRank(
  env: Env,
  corporationId: string,
  rankId: number
): Promise<SocialResult<void>> {
  return act(env, 'manageRanks', 'DELETE', `${corporation(corporationId)}/ranks/${rankId}`)
}

/** Hands the leadership to a member (CEO only). */
export function transferOrganisation(
  env: Env,
  corporationId: string,
  playerId: string
): Promise<SocialResult<void>> {
  return act(env, 'leadership', 'POST', `${corporation(corporationId)}/transfer`, { playerId })
}

/** Disbands the organisation (CEO only). */
export function disbandOrganisation(env: Env, corporationId: string): Promise<SocialResult<void>> {
  return act(env, 'leadership', 'DELETE', corporation(corporationId))
}
