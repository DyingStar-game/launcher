import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useNavigationStore } from '@stores/navigation'
import { useTranslation } from 'react-i18next'
import FriendItem from '@components/molecules/FriendItem'
import Button from '@components/atoms/Button'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import SectionLabel from '@components/atoms/SectionLabel'
import { sortByName } from '@lib/sortByName'

/** Compact social preview in the home page's side column (friends + request badge). */
export default function SocialPanel(): React.JSX.Element {
  const { data, status } = useSocialSnapshot({ livePresence: true })
  const { navigate, openPlayer } = useNavigationStore()
  const { t, i18n } = useTranslation()

  const { friends, incoming } = data
  const notifications = incoming.length
  const sortedFriends = sortByName(friends, i18n.language)
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

  return (
    <div className="flex h-full flex-col">
      {/* Header, with the number of incoming requests at its end */}
      <div className="flex items-center gap-3 mb-4">
        <SectionLabel as="h2">{t('universe.social.title')}</SectionLabel>
        <div className="h-px flex-1 bg-ds-border" />
        {notifications > 0 && (
          <div className="min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full text-xs font-semibold bg-red-500 text-white shadow-ds-alert">
            {notifications}
          </div>
        )}
      </div>

      {/* Friend list */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {placeholder && <p className="text-sm text-ds-muted">{placeholder}</p>}
        {showSkeleton && <ListSkeleton rows={3} />}

        {sortedFriends.map((friend) => (
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
