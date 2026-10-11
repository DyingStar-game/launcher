import { useTranslation } from 'react-i18next'
import type { Friend } from '@shared/types/social'
import PlayerIdentity from './PlayerIdentity'
import ListRow from '@components/atoms/ListRow'

export type FriendRowProps = {
  friend: Friend
  /** Opens the friend's sheet. */
  onOpen: () => void
}

/** Friend list row: avatar with presence, name and status (online / in mission / offline). */
export default function FriendRow({ friend, onOpen }: FriendRowProps): React.JSX.Element {
  const { t } = useTranslation()
  const statusLabel =
    friend.status === 'mission' && friend.system
      ? t('friendStatus.missionIn', { system: friend.system })
      : t(`friendStatus.${friend.status}`)

  return (
    <ListRow>
      <PlayerIdentity name={friend.name} status={friend.status} onOpen={onOpen}>
        <span className="text-xs text-ds-muted">{statusLabel}</span>
      </PlayerIdentity>
    </ListRow>
  )
}
