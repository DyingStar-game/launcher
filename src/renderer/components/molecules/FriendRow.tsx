import { useTranslation } from 'react-i18next'
import type { Friend } from '@shared/types/social'
import PlayerIdentity from './PlayerIdentity'

type Props = {
  friend: Friend
  /** Opens the friend's sheet. */
  onOpen: () => void
}

/** Friend list row: avatar with presence, name and status (online / in mission / offline). */
export default function FriendRow({ friend, onOpen }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const statusLabel =
    friend.status === 'mission' && friend.system
      ? t('friendStatus.missionIn', { system: friend.system })
      : t(`friendStatus.${friend.status}`)

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)]">
      <PlayerIdentity name={friend.name} status={friend.status} onOpen={onOpen}>
        <span className="text-xs text-[var(--color-ds-muted)]">{statusLabel}</span>
      </PlayerIdentity>
    </div>
  )
}
