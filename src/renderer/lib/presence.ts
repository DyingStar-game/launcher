import type { FriendStatus } from '@shared/types/social'

/** Presence dot colour per status. */
export const PRESENCE_COLOR: Record<FriendStatus, string> = {
  online: 'bg-green-500',
  mission: 'bg-orange-400',
  offline: 'bg-gray-500'
}

/** Soft halo around a presence dot, same colour (none when offline). */
export const PRESENCE_HALO: Record<FriendStatus, string> = {
  online: 'ring-2 ring-green-500/30',
  mission: 'ring-2 ring-orange-400/30',
  offline: ''
}
