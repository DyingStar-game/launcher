/**
 * Social types (ADR 0007).
 *
 * `Api*` types describe the `social` service responses, written by hand from its README and
 * code at commit 4df4e0a of DyingStar-game/services (`social/src`). Only the fields the
 * launcher reads are listed. The other types are what main sends to the renderer.
 */

/** Presence status reported by the game server. */
export type ApiPresenceStatus = 'online' | 'mission' | 'offline'

/** Corporation recruitment mode. */
export type ApiRecruitment = 'open' | 'apply' | 'closed'

/** Paginated list envelope. */
export interface ApiPage<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

/** Player profile (`player_profiles`). */
export interface ApiProfile {
  playerId: string
  displayName: string
  avatarUrl: string | null
}

/** `GET /api/friends` item: profile plus presence. */
export interface ApiFriend extends ApiProfile {
  status: ApiPresenceStatus
  location: { system?: string; scene?: string } | null
}

/** Pending friend request with the other party's profile. */
export interface ApiFriendRequest {
  id: number
  createdAt: string
  player: ApiProfile
}

/** `GET /api/friends/requests`. */
export interface ApiFriendRequests {
  incoming: ApiFriendRequest[]
  outgoing: ApiFriendRequest[]
}

/** `GET /api/corporations` item. */
export interface ApiCorporation {
  id: string
  name: string
  ticker: string
  recruitment: ApiRecruitment
  memberCount: number
}

/** `GET /api/me/corporations` item. */
export interface ApiMyCorporation {
  id: string
}

/** `GET /api/me/corporation/requests` item (`kind`: the player applied, or was invited). */
export interface ApiCorporationRequest {
  id: number
  corporationId: string
  kind: 'application' | 'invitation'
}

/** Error body of the service. */
export interface ApiError {
  error: string
  message?: string
  status?: number
}

/** Friend status shown by the launcher. */
export type FriendStatus = 'online' | 'mission' | 'offline'

export interface Friend {
  /** Player id (Keycloak subject). */
  id: string
  name: string
  status: FriendStatus
  /** Star system while in mission, when the game server reports it. */
  system?: string
  avatar?: string
}

export interface FriendRequest {
  id: number
  playerId: string
  name: string
}

export interface Organisation {
  id: string
  name: string
  ticker: string
  members: number
  recruitment: ApiRecruitment
  isMember: boolean
  /** The player applied and waits for an answer. */
  applicationPending: boolean
}

/** A player found by name on the player search screen (ADR 0008). */
export interface PlayerSearchResult {
  id: string
  name: string
  avatar?: string
}

/** How a found player relates to the signed-in player. */
export type PlayerRelation = 'self' | 'friend' | 'incoming' | 'outgoing' | 'none'

/** Everything the social page and panel show, for one environment. */
export interface SocialSnapshot {
  /** The signed-in player's id in `social`. */
  selfId: string
  friends: Friend[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  organisations: Organisation[]
}

/** Error codes sent by main; the renderer translates them (`universe.socialPage.errors.*`). */
export type SocialErrorCode =
  | 'unavailable'
  | 'notSignedIn'
  | 'sessionExpired'
  | 'sanctioned'
  | 'playerNotFound'
  | 'alreadyFriendsOrPending'
  | 'blocked'
  | 'invalidTarget'
  | 'nameOrTickerTaken'
  | 'alreadyMemberOrPending'
  | 'recruitmentClosed'
  | 'invalidInput'
  | 'unknown'

/** Result of a `social:*` IPC call: errors cross IPC as codes, never as thrown errors. */
export type SocialResult<T> = { ok: true; data: T } | { ok: false; error: SocialErrorCode }

/** Outcome of joining an organisation. */
export type JoinOutcome = 'joined' | 'applied'

/** Outcome of sending a friend request. */
export type FriendRequestOutcome = 'sent' | 'accepted'
