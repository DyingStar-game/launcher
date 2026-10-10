import type { FriendStatus } from '@shared/types/social'

/** Presence dot colour per status. */
export const PRESENCE_COLOR: Record<FriendStatus, string> = {
  online: 'bg-green-500',
  mission: 'bg-orange-400',
  offline: 'bg-gray-500'
}
