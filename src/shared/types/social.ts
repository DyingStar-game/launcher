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

/** `GET /api/profiles/:playerId`: public profile with presence and memberships. */
export interface ApiPublicProfile extends ApiProfile {
  faction: string | null
  biography: string | null
  role: string | null
  reputation: number
  playtimeSeconds: number
  rpSheet: { characterName?: string; story?: string; alignment?: string } | null
  createdAt: string
  status: ApiPresenceStatus
  corporations: { id: string; name: string; ticker: string }[]
  politics: { id: string; type: string; name: string }[]
}

/** Member on a corporation page: profile, rank and presence. */
export interface ApiCorporationMember extends ApiProfile {
  rank: { name: string; priority: number; isCeo: boolean }
  status: ApiPresenceStatus
}

/** `GET /api/corporations/:id`: public corporation page (first 50 members, 20 subsidiaries). */
export interface ApiCorporationPage extends ApiCorporation {
  description: string | null
  logoUrl: string | null
  ceoId: string
  createdAt: string
  parent: { id: string; name: string; ticker: string } | null
  subsidiaries: ApiCorporation[]
  subsidiaryCount: number
  members: ApiCorporationMember[]
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

/** A player's public sheet (ADR 0009). Optional fields are absent when empty. */
export interface PlayerProfile {
  id: string
  name: string
  avatar?: string
  status: FriendStatus
  faction?: string
  role?: string
  biography?: string
  characterName?: string
  alignment?: string
  story?: string
  reputation: number
  playtimeHours: number
  /** ISO date of the profile creation. */
  memberSince: string
  corporations: { id: string; name: string; ticker: string }[]
  /** Political entities; `type` is the level (`commune` … `federation`). */
  politics: { id: string; type: string; name: string }[]
}

/** Short reference to an organisation. */
export interface OrganisationRef {
  id: string
  name: string
  ticker: string
}

/** An organisation's public sheet (ADR 0010). Optional fields are absent when empty. */
export interface OrganisationProfile extends OrganisationRef {
  description?: string
  logo?: string
  recruitment: ApiRecruitment
  /** Total member count. */
  members: number
  /** ISO creation date. */
  createdAt: string
  ceo?: { id: string; name: string }
  parent?: OrganisationRef
  subsidiaries: (OrganisationRef & { members: number })[]
  subsidiaryCount: number
}

/** A member of an organisation, with their rank name and presence. */
export interface OrganisationMember {
  id: string
  name: string
  rank: string
  status: FriendStatus
}

/** One page of an organisation's members (ADR 0012), highest rank first, then seniority. */
export interface OrganisationMembersPage {
  members: OrganisationMember[]
  /** Total member count. */
  total: number
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
  /** Ids of the organisations the player belongs to. */
  memberOf: string[]
  /** Ids of the organisations the player applied to, awaiting an answer. */
  appliedTo: string[]
}

/** Error codes sent by main; the renderer translates them (`universe.socialPage.errors.*`). */
export type SocialErrorCode =
  | 'unavailable'
  | 'notSignedIn'
  | 'sessionExpired'
  | 'sanctioned'
  | 'playerNotFound'
  | 'organisationNotFound'
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
