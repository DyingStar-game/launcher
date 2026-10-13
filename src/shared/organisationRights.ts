/**
 * What a rank lets a member do in their organisation (ADR 0021, 0024), mirroring `social`'s
 * rules at commit 75eb1ce of DyingStar-game/services (`hasCorporationPermission`). The service
 * stays the authority: this only hides what it would refuse.
 */

import { ORGANISATION_PERMISSIONS, type OrganisationPermission } from './schemas/social'

export type { OrganisationPermission }

/** What the rules read of a rank. */
type RankRights = { isCeo: boolean; permissions: readonly string[]; priority: number }

/** Whether a rank holds a permission: the CEO holds every one. */
export function can(
  rank: { isCeo: boolean; permissions: readonly string[] },
  permission: OrganisationPermission
): boolean {
  return rank.isCeo || rank.permissions.includes(permission)
}

/** Whether a rank holds any management right, so its member sees "Manage". */
export function canManage(rank: { isCeo: boolean; permissions: readonly string[] }): boolean {
  return ORGANISATION_PERMISSIONS.some((permission) => can(rank, permission))
}

/** Whether a member may act on another's rank or membership: strictly below their own. */
export function canActOn(mine: RankRights, target: { priority: number; isCeo: boolean }): boolean {
  return !target.isCeo && target.priority < mine.priority
}

/** Ranks a member may give: never the CEO's (a transfer), strictly below their own. */
export function assignableRanks<R extends { priority: number; isCeo: boolean }>(
  mine: RankRights,
  ranks: readonly R[]
): R[] {
  return ranks.filter((rank) => canActOn(mine, rank))
}
