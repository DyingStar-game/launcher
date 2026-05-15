import { Friend } from '@stores/social'

type Props = {
  friend: Friend
}

export default function FriendItem({ friend }: Props) {
  const statusColor =
    friend.status === 'online'
      ? 'bg-green-500'
      : friend.status === 'ingame'
      ? 'bg-orange-400'
      : 'bg-gray-500'

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)] transition-colors cursor-pointer">

      {/* Avatar */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-[var(--color-ds-border)] flex items-center justify-center text-xs">
          {friend.name.charAt(0)}
        </div>

        {/* Status dot */}
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--color-ds-surface)] ${statusColor}`}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col leading-tight">
        <span className="text-sm text-[var(--color-ds-text)]">
          {friend.name}
        </span>

        {friend.status === 'ingame' && (
          <span className="text-xs text-orange-400">
            En jeu • {friend.game}
          </span>
        )}

        {friend.status === 'online' && (
          <span className="text-xs text-green-400">
            En ligne
          </span>
        )}

        {friend.status === 'offline' && (
          <span className="text-xs text-[var(--color-ds-muted)]">
            Hors ligne
          </span>
        )}
      </div>
    </div>
  )
}