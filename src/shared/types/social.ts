/**
 * Social types (ADR 0007).
 *
 * `Api*` types describe the `social` service responses, written by hand from its README and
 * code at commit 75eb1ce of DyingStar-game/services (`social/src`). Only the fields the
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
  rank: ApiRank
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

/** A corporation rank (`corporation_ranks`); `priority`: higher wins. */
export interface ApiRank {
  id: number
  name: string
  priority: number
  /** Permissions held; the CEO rank holds every permission whatever it lists. */
  permissions: string[]
  isCeo: boolean
  /** Rank given to new members. */
  isDefault: boolean
}

/** `GET /api/me/corporations` item: the corporation with the player's rank in it. */
export interface ApiMyCorporation {
  id: string
  name: string
  ticker: string
  recruitment: ApiRecruitment
  rank: ApiRank
}

/** `GET /api/me/corporation/requests` item (`kind`: the player applied, or was invited). */
export interface ApiCorporationRequest {
  id: number
  corporationId: string
  kind: 'application' | 'invitation'
  corporation: { id: string; name: string; ticker: string }
}

/** `GET /api/corporations/:id/requests` item: a pending application or invitation. */
export interface ApiCorporationRequestView {
  id: number
  corporationId: string
  kind: 'application' | 'invitation'
  message: string | null
  createdAt: string
  player: ApiProfile
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

/** An organisation found by name or tag (ADR 0024). */
export interface OrganisationSearchResult {
  id: string
  name: string
  ticker: string
  members: number
  recruitment: ApiRecruitment
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

/** A member of an organisation, with their rank and presence. */
export interface OrganisationMember {
  id: string
  name: string
  /** Rank name. */
  rank: string
  rankId: number
  /** Higher wins (ADR 0021). */
  rankPriority: number
  isCeo: boolean
  status: FriendStatus
}

/** A pending application or invitation of an organisation, seen by its managers (ADR 0021). */
export interface OrganisationPendingRequest {
  id: number
  kind: 'application' | 'invitation'
  player: { id: string; name: string }
  message?: string
}

/** Outcome of inviting a player: a pending application from them is accepted at once. */
export type InviteOutcome = 'invited' | 'joined'

/** One page of an organisation's members (ADR 0012), highest rank first, then seniority. */
export interface OrganisationMembersPage {
  members: OrganisationMember[]
  /** Total member count. */
  total: number
}

/** A rank of an organisation (ADR 0021). */
export interface OrganisationRank {
  id: number
  name: string
  /** Higher wins: a member only acts on ranks strictly below their own. */
  priority: number
  permissions: string[]
  isCeo: boolean
  isDefault: boolean
}

/** An organisation the player belongs to, with their rank in it. */
export interface Membership extends OrganisationRef {
  recruitment: ApiRecruitment
  rank: OrganisationRank
}

/** A pending invitation received, or application sent, by the player (ADR 0023). */
export interface OrganisationRequest {
  id: number
  organisation: OrganisationRef
}

/** An application received by an organisation (ADR 0024). */
export interface ReceivedApplication {
  id: number
  player: { id: string; name: string }
  /** The applicant's message, when they wrote one. */
  message?: string
}

/** Pending applications of one organisation the player recruits for. */
export interface OrganisationApplications {
  organisation: OrganisationRef
  applications: ReceivedApplication[]
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
  /** Organisations the player belongs to, with their rank. */
  memberships: Membership[]
  /** Invitations to join an organisation, awaiting the player's answer. */
  invitations: OrganisationRequest[]
  /** Applications the player sent, awaiting the organisation's answer. */
  applications: OrganisationRequest[]
  /** Applications received by the organisations the player recruits for (ADR 0024). */
  receivedApplications: OrganisationApplications[]
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
  | 'requestNotFound'
  | 'forbidden'
  | 'alreadyMember'
  | 'alreadyMemberOrInvited'
  | 'rankNameTaken'
  | 'invalidInput'
  | 'unknown'

/** Result of a `social:*` IPC call: errors cross IPC as codes, never as thrown errors. */
export type SocialResult<T> = { ok: true; data: T } | { ok: false; error: SocialErrorCode }

/** Outcome of joining an organisation. */
export type JoinOutcome = 'joined' | 'applied'

/** Outcome of sending a friend request. */
export type FriendRequestOutcome = 'sent' | 'accepted'
