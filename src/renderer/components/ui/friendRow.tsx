export function FriendRow({ friend }) {
    const color =
      friend.status === 'online'
        ? 'bg-green-500'
        : friend.status === 'ingame'
        ? 'bg-orange-400'
        : 'bg-gray-500'
  
    return (
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)]">
  
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs">
              {friend.name[0]}
            </div>
            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${color}`} />
          </div>
  
          <div>
            <p className="text-sm">{friend.name}</p>
            <p className="text-xs text-[var(--color-ds-muted)]">
              {friend.status === 'ingame'
                ? `En jeu • ${friend.game}`
                : friend.status}
            </p>
          </div>
        </div>
  
        <button className="text-xs text-[var(--color-ds-muted)] hover:text-white">
          Message
        </button>
      </div>
    )
  }