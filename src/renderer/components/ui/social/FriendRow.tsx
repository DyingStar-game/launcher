import { useTranslation } from 'react-i18next'
import type { Friend } from '@stores/social'

/** Friend list row with online/mission/offline status indicator. */
export function FriendRow({ friend }: { friend: Friend }): React.JSX.Element {
  const { t } = useTranslation()

  const color =
    friend.status === 'online'
      ? 'bg-green-500'
      : friend.status === 'mission'
        ? 'bg-orange-400'
        : 'bg-gray-500'

  const statusLabel =
    friend.status === 'mission'
      ? friend.system
        ? t('friendStatus.missionIn', { system: friend.system })
        : t('friendStatus.mission')
      : t(`friendStatus.${friend.status}`)

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)]">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">
            {friend.name[0]}
          </div>
          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${color}`} />
        </div>
        <div>
          <p className="text-sm">{friend.name}</p>
          <p className="text-xs text-[var(--color-ds-muted)]">{statusLabel}</p>
        </div>
      </div>
    </div>
  )
}
