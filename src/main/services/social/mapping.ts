import type {
  ApiCorporation,
  ApiCorporationMember,
  ApiCorporationPage,
  ApiCorporationRequest,
  ApiFriend,
  ApiFriendRequest,
  ApiProfile,
  ApiPublicProfile,
  Friend,
  FriendRequest,
  Organisation,
  OrganisationMember,
  OrganisationProfile,
  PlayerProfile,
  PlayerSearchResult,
  SocialErrorCode
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

/**
 * Builds the organisation list from the directory, the player's corporations and their
 * pending corporation requests.
 */
export function toOrganisations(
  directory: ApiCorporation[],
  memberOf: ReadonlySet<string>,
  requests: ApiCorporationRequest[]
): Organisation[] {
  const applied = new Set(
    requests.filter((r) => r.kind === 'application').map((r) => r.corporationId)
  )
  return directory.map((c) => ({
    id: c.id,
    name: c.name,
    ticker: c.ticker,
    members: c.memberCount,
    recruitment: c.recruitment,
    isMember: memberOf.has(c.id),
    applicationPending: applied.has(c.id)
  }))
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
  return { id: api.playerId, name: api.displayName, rank: api.rank.name, status: api.status }
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
  }
  if (status === 403 && action === 'joinOrganisation') return 'recruitmentClosed'
  if (status === 404 && (action === 'addFriend' || action === 'viewPlayer')) return 'playerNotFound'
  if (status === 404 && action === 'viewOrganisation') return 'organisationNotFound'
  return 'unknown'
}
