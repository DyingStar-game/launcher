import { useTranslation } from 'react-i18next'
import { Friend } from '@stores/social'

type Props = {
  friend: Friend
}

/** Compact friend row for the universe social preview panel. */
export default function FriendItem({ friend }: Props): React.JSX.Element {
  const { t } = useTranslation()

  const statusColor =
    friend.status === 'online'
      ? 'bg-green-500'
      : friend.status === 'ingame'
        ? 'bg-orange-400'
        : 'bg-gray-500'

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)] transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-[var(--color-ds-border)] flex items-center justify-center text-xs">
          {friend.name.charAt(0)}
        </div>
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--color-ds-surface)] ${statusColor}`}
        />
      </div>

      <div className="flex flex-col leading-tight">
        <span className="text-sm text-[var(--color-ds-text)]">{friend.name}</span>

        {friend.status === 'ingame' && (
          <span className="text-xs text-orange-400">
            {t('friendStatus.ingameWithGame', { game: friend.game ?? '' })}
          </span>
        )}

        {friend.status === 'online' && (
          <span className="text-xs text-green-400">{t('friendStatus.online')}</span>
        )}

        {friend.status === 'offline' && (
          <span className="text-xs text-[var(--color-ds-muted)]">{t('friendStatus.offline')}</span>
        )}
      </div>
    </div>
  )
}
