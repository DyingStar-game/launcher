import type { PlayerRelation, SocialSnapshot } from '@shared/types/social'

/** How a found player relates to the signed-in player, from the loaded social data (ADR 0008). */
export function playerRelation(
  playerId: string,
  social: Pick<SocialSnapshot, 'selfId' | 'friends' | 'incoming' | 'outgoing'>
): PlayerRelation {
  if (playerId === social.selfId) return 'self'
  if (social.friends.some((f) => f.id === playerId)) return 'friend'
  if (social.incoming.some((r) => r.playerId === playerId)) return 'incoming'
  if (social.outgoing.some((r) => r.playerId === playerId)) return 'outgoing'
  return 'none'
}
