import { useEffect } from 'react'
import { useSocialStore } from '@store/social'
import { useNavigationStore } from '@store/navigation'
import { useTranslation } from 'react-i18next'
import FriendItem from '@components/ui/friendItem'

export default function SocialPanel(): React.JSX.Element {
  const { friends, requests, fetchAll } = useSocialStore()
  const { navigate } = useNavigationStore()
  const { t } = useTranslation()

  useEffect(() => {
    fetchAll()
  }, [])

  // 🔔 Notifications = nombre de requêtes
  const notifications = requests.length

  // 👀 Discord-like → limiter l’aperçu
  const visibleFriends = friends.slice(0, 5)

  return (
    <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-4 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          {t('universe.social.title')}
        </h2>

        {notifications > 0 && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
            {notifications}
          </span>
        )}
      </div>

      {/* Requests preview */}
      {notifications > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-[var(--color-ds-surface-hover)]">
          <p className="text-xs text-[var(--color-ds-muted)]">
            {t('universe.social.notifications', { count: notifications })}
          </p>
        </div>
      )}

      {/* Friend list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">

        {friends.length === 0 && (
          <p className="text-sm text-[var(--color-ds-muted)]">
            {t('universe.social.noFriends')}
          </p>
        )}

        {visibleFriends.map((friend) => (
          <FriendItem key={friend.id} friend={friend} />
        ))}
      </div>

      {/* Footer */}
      <button
        onClick={() => navigate('social')}
        className="mt-3 px-3 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
      >
        {t('universe.social.seeAll')} →
      </button>
    </div>
  )
}