import type {
  ApiCorporation,
  ApiCorporationRequest,
  ApiFriend,
  ApiFriendRequest,
  ApiProfile,
  Friend,
  FriendRequest,
  Organisation,
  PlayerSearchResult,
  SocialErrorCode
} from '@shared/types/social'

/** Social action that got an error; `CONFLICT` and `FORBIDDEN` mean different things per action. */
export type SocialAction =
  | 'load'
  | 'searchPlayers'
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
  if (status === 404 && action === 'addFriend') return 'playerNotFound'
  return 'unknown'
}
