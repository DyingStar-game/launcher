import type { z } from 'zod'
import type {
  ApiCorporation,
  ApiCorporationMember,
  ApiCorporationPage,
  ApiCorporationRequest,
  ApiCorporationRequestView,
  ApiFriend,
  ApiFriendRequest,
  ApiMyCorporation,
  ApiProfile,
  ApiPublicProfile,
  ApiRank,
  Friend,
  FriendRequest,
  Membership,
  OrganisationSearchResult,
  OrganisationMember,
  OrganisationPendingRequest,
  OrganisationProfile,
  OrganisationRank,
  OrganisationRequest,
  PlayerProfile,
  PlayerSearchResult,
  ReceivedApplication,
  SocialErrorCode,
  SocialResult
} from '@shared/types/social'

/** Social action that got an error; `CONFLICT` and `FORBIDDEN` mean different things per action. */
export type SocialAction =
  | 'load'
  | 'searchPlayers'
  | 'viewPlayer'
  | 'viewOrganisation'
  | 'addFriend'
  | 'removeFriend'
  | 'answerRequest'
  | 'joinOrganisation'
  | 'createOrganisation'
  | 'answerInvitation'
  | 'searchOrganisations'
  | 'answerApplication'
  | 'updateProfile'
  | 'updateOrganisation'
  | 'viewRequests'
  | 'invite'
  | 'manageMembers'
  | 'manageRanks'
  | 'leadership'

/** Maps a `social` friend to the launcher's friend. */
export function toFriend(api: ApiFriend): Friend {
  return {
    id: api.playerId,
    name: api.displayName,
    status: api.status,
    ...(api.status === 'mission' && api.location?.system ? { system: api.location.system } : {}),
    ...(api.avatarUrl ? { avatar: api.avatarUrl } : {})
  }
}

/** Maps a pending friend request (incoming or outgoing) to the launcher's request. */
export function toFriendRequest(api: ApiFriendRequest): FriendRequest {
  return { id: api.id, playerId: api.player.playerId, name: api.player.displayName }
}

/** Maps a directory entry to an organisation search result. */
export function toOrganisationSearchResult(api: ApiCorporation): OrganisationSearchResult {
  return {
    id: api.id,
    name: api.name,
    ticker: api.ticker,
    members: api.memberCount,
    recruitment: api.recruitment
  }
}

/** Maps a pending application received by an organisation; an empty message is dropped. */
export function toReceivedApplication(api: ApiCorporationRequestView): ReceivedApplication {
  const message = text(api.message)
  return {
    id: api.id,
    player: { id: api.player.playerId, name: api.player.displayName },
    ...(message ? { message } : {})
  }
}

/** Maps a corporation rank. */
export function toOrganisationRank(api: ApiRank): OrganisationRank {
  return {
    id: api.id,
    name: api.name,
    priority: api.priority,
    permissions: api.permissions,
    isCeo: api.isCeo,
    isDefault: api.isDefault
  }
}

/** Maps one of the player's corporations, with their rank. */
export function toMembership(api: ApiMyCorporation): Membership {
  return {
    id: api.id,
    name: api.name,
    ticker: api.ticker,
    recruitment: api.recruitment,
    rank: toOrganisationRank(api.rank)
  }
}

/** Maps a pending invitation or application of the player. */
export function toOrganisationRequest(api: ApiCorporationRequest): OrganisationRequest {
  const { id, name, ticker } = api.corporation
  return { id: api.id, organisation: { id, name, ticker } }
}

/** Maps a found profile to a player search result. */
export function toPlayerSearchResult(api: ApiProfile): PlayerSearchResult {
  return {
    id: api.playerId,
    name: api.displayName,
    ...(api.avatarUrl ? { avatar: api.avatarUrl } : {})
  }
}

/** Keeps a text field only when it has content. */
function text(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Maps a public profile to the player sheet; empty text fields are dropped. */
export function toPlayerProfile(api: ApiPublicProfile): PlayerProfile {
  const optional = {
    avatar: text(api.avatarUrl),
    faction: text(api.faction),
    role: text(api.role),
    biography: text(api.biography),
    characterName: text(api.rpSheet?.characterName),
    alignment: text(api.rpSheet?.alignment),
    story: text(api.rpSheet?.story)
  }
  return {
    id: api.playerId,
    name: api.displayName,
    status: api.status,
    ...Object.fromEntries(Object.entries(optional).filter(([, v]) => v !== undefined)),
    reputation: api.reputation,
    playtimeHours: Math.floor(api.playtimeSeconds / 3600),
    memberSince: api.createdAt,
    corporations: api.corporations.map(({ id, name, ticker }) => ({ id, name, ticker })),
    politics: api.politics.map(({ id, type, name }) => ({ id, type, name }))
  }
}

/** Maps a corporation member to the launcher's organisation member. */
export function toOrganisationMember(api: ApiCorporationMember): OrganisationMember {
  return {
    id: api.playerId,
    name: api.displayName,
    rank: api.rank.name,
    rankId: api.rank.id,
    rankPriority: api.rank.priority,
    isCeo: api.rank.isCeo,
    status: api.status
  }
}

/** Maps a pending request of an organisation, for its managers; an empty message is dropped. */
export function toOrganisationPendingRequest(
  api: ApiCorporationRequestView
): OrganisationPendingRequest {
  const message = text(api.message)
  return {
    id: api.id,
    kind: api.kind,
    player: { id: api.player.playerId, name: api.player.displayName },
    ...(message ? { message } : {})
  }
}

/** Maps a corporation page to the organisation sheet (members are paged apart, ADR 0012). */
export function toOrganisationProfile(api: ApiCorporationPage): OrganisationProfile {
  const ceo = api.members.find((m) => m.playerId === api.ceoId)
  const description = text(api.description)
  const logo = text(api.logoUrl)
  return {
    id: api.id,
    name: api.name,
    ticker: api.ticker,
    ...(description ? { description } : {}),
    ...(logo ? { logo } : {}),
    recruitment: api.recruitment,
    members: api.memberCount,
    createdAt: api.createdAt,
    ...(ceo ? { ceo: { id: ceo.playerId, name: ceo.displayName } } : {}),
    ...(api.parent
      ? { parent: { id: api.parent.id, name: api.parent.name, ticker: api.parent.ticker } }
      : {}),
    subsidiaries: api.subsidiaries.map((s) => ({
      id: s.id,
      name: s.name,
      ticker: s.ticker,
      members: s.memberCount
    })),
    subsidiaryCount: api.subsidiaryCount
  }
}

/** Actions of an organisation's managers (ADR 0021): a `403` is a missing right or rank. */
const MANAGEMENT = new Set<SocialAction>([
  'answerApplication',
  'updateOrganisation',
  'viewRequests',
  'invite',
  'manageMembers',
  'manageRanks',
  'leadership'
])

/** Maps an HTTP status and `social` error code to the launcher's error code, per action. */
export function toSocialErrorCode(
  status: number,
  apiCode: string | undefined,
  action: SocialAction
): SocialErrorCode {
  if (status === 401) return 'sessionExpired'
  if (status === 403 && apiCode === 'SANCTIONED') return 'sanctioned'
  if (status >= 500) return 'unavailable'
  if (status === 400 && apiCode === 'INVALID_TARGET') return 'invalidTarget'
  if (status === 400) return 'invalidInput'
  if (status === 409 && apiCode === 'BLOCKED') return 'blocked'
  if (status === 409) {
    if (action === 'addFriend') return 'alreadyFriendsOrPending'
    if (action === 'createOrganisation') return 'nameOrTickerTaken'
    if (action === 'joinOrganisation') return 'alreadyMemberOrPending'
    if (action === 'answerApplication') return 'alreadyMember'
    if (action === 'updateOrganisation') return 'nameOrTickerTaken'
    if (action === 'invite') return 'alreadyMemberOrInvited'
    if (action === 'manageRanks') return 'rankNameTaken'
  }
  if (status === 403 && action === 'joinOrganisation') return 'recruitmentClosed'
  if (status === 404 && (action === 'addFriend' || action === 'viewPlayer')) return 'playerNotFound'
  if (status === 404 && action === 'viewOrganisation') return 'organisationNotFound'
  if (status === 404 && (action === 'answerInvitation' || action === 'answerApplication')) {
    return 'requestNotFound'
  }
  if (status === 403 && MANAGEMENT.has(action)) return 'forbidden'
  if (status === 404 && MANAGEMENT.has(action)) return 'organisationNotFound'
  return 'unknown'
}

/** Parses an IPC payload with its shared form schema (ADR 0022): a bad one never reaches `social`. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown
): SocialResult<z.output<S>> {
  const parsed = schema.safeParse(input)
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: 'invalidInput' }
}
