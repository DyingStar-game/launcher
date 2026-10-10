import { useEffect } from 'react'
import { useSocialStore } from '@stores/social'
import { useEnvStore } from '@stores/env'
import { useAccountStore } from '@stores/account'
import { useNavigationStore } from '@stores/navigation'
import { useTranslation } from 'react-i18next'
import FriendItem from '@components/molecules/FriendItem'
import Button from '@components/atoms/Button'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

/** Compact social preview on the universe grid (friends + request badge). */
export default function SocialPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const accountStatus = useAccountStore((s) => s.data[activeEnv].status)
  const { data, fetchAll } = useSocialStore()
  const { navigate, openPlayer } = useNavigationStore()
  const { t } = useTranslation()

  const { friends, incoming, status } = data[activeEnv]
  const notifications = incoming.length
  const visibleFriends = friends.slice(0, 5)
  const showSkeleton = useDelayedFlag(status === 'loading')
  const placeholder =
    status === 'unavailable'
      ? t('universe.socialPage.state.unavailable')
      : status === 'notSignedIn'
        ? t('universe.socialPage.state.notSignedIn')
        : status === 'error'
          ? t('universe.socialPage.state.errorShort')
          : friends.length === 0 && status === 'ready'
            ? t('universe.social.noFriends')
            : null

  useEffect(() => {
    void fetchAll()
  }, [activeEnv, accountStatus, fetchAll])

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
        {placeholder && <p className="text-sm text-[var(--color-ds-muted)]">{placeholder}</p>}
        {showSkeleton && <ListSkeleton rows={3} />}

        {visibleFriends.map((friend) => (
          <FriendItem key={friend.id} friend={friend} onOpen={() => openPlayer(friend.id)} />
        ))}
      </div>

      {/* Footer */}
      <Button onClick={() => navigate('social')} variant="secondary" className="mt-4 w-full">
        {t('universe.social.seeAll')} →
      </Button>
    </div>
  )
}
