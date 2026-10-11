import { useTranslation } from 'react-i18next'
import type { Friend } from '@shared/types/social'
import { cn } from '@lib/cn'
import PlayerIdentity from './PlayerIdentity'

export type FriendItemProps = {
  friend: Friend
  /** Opens the friend's sheet. */
  onOpen: () => void
}

const STATUS_TEXT = {
  online: 'text-green-400',
  mission: 'text-orange-400',
  offline: 'text-ds-muted'
} as const

/** Compact friend row for the universe social panel, status coloured. */
export default function FriendItem({ friend, onOpen }: FriendItemProps): React.JSX.Element {
  const { t } = useTranslation()
  const statusLabel =
    friend.status === 'mission' && friend.system
      ? t('friendStatus.missionIn', { system: friend.system })
      : t(`friendStatus.${friend.status}`)

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-ds-surface-hover transition-colors">
      <PlayerIdentity name={friend.name} status={friend.status} onOpen={onOpen}>
        <span className={cn('text-xs', STATUS_TEXT[friend.status])}>{statusLabel}</span>
      </PlayerIdentity>
    </div>
  )
}
