import { useEffect } from 'react'
import { useSocialStore } from '@store/social'
import { useNavigationStore } from '@store/navigation'
import { useTranslation } from 'react-i18next'
import FriendItem from '@components/ui/friendItem'
import Button from '@components/ui/button'

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
    <div className="relative bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col h-full shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">
      {notifications > 0 && (
        <div className="absolute top-4 right-4">
          <div className="min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white shadow-[0_10px_25px_rgba(239,68,68,0.25)]">
            {notifications}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.social.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

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
      <Button
        onClick={() => navigate('social')}
        variant="secondary"
        className="mt-4 w-full justify-between"
      >
        {t('universe.social.seeAll')} →
      </Button>
    </div>
  )
}