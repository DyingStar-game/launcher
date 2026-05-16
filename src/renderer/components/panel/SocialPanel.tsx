import { useEffect } from 'react'
import { useSocialStore } from '@stores/social'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import { useTranslation } from 'react-i18next'
import FriendItem from '@components/ui/social/FriendItem'
import Button from '@components/ui/primitives/Button'

/** Compact social preview on the universe grid (friends + request badge). */
export default function SocialPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, fetchAll } = useSocialStore()
  const { navigate } = useNavigationStore()
  const { t } = useTranslation()

  const { friends, requests } = data[activeEnv]
  const notifications = requests.length
  const visibleFriends = friends.slice(0, 5)

  useEffect(() => {
    fetchAll()
  }, [activeEnv, fetchAll])

  return (
    <div className="ds-panel ds-panel-padded-sm relative flex flex-col h-full">
      {notifications > 0 && (
        <div className="absolute top-4 right-4">
          <div className="min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white shadow-[0_10px_25px_rgba(239,68,68,0.25)]">
            {notifications}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="ds-section-label">{t('universe.social.title')}</h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Friend list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
        {friends.length === 0 && (
          <p className="text-sm text-[var(--color-ds-muted)]">{t('universe.social.noFriends')}</p>
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
