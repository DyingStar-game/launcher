import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '@stores/navigation'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useAcceptFriendRequest, useDeclineFriendRequest } from '@hooks/social/useSocialActions'
import { useEnvStore } from '@stores/env'
import { useScrollMemory } from '@hooks/usePageState'
import Button from '@components/atoms/Button'
import FriendRow from '@components/molecules/FriendRow'
import ListPanel from '@components/molecules/ListPanel'
import PageHeader from '@components/molecules/PageHeader'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import RequestRow from '@components/molecules/RequestRow'
import SubTabList from '@components/molecules/SubTabList'
import { Tabs, TabsContent } from '@components/ui/tabs'
import { SOCIAL_SUB_TABS, type SocialSubTab } from '@lib/socialSections'
import PlayerSearch from './PlayerSearch'
import SocialStateMessage from './SocialStateMessage'

type Props = {
  tab: SocialSubTab
  onTabChange: (tab: SocialSubTab) => void
}

/** Friends section of the social page (ADR 0023): my friends, find players, friend requests. */
export default function FriendsSection({ tab, onTabChange }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, status } = useSocialSnapshot()
  const acceptRequest = useAcceptFriendRequest().mutateAsync
  const declineRequest = useDeclineFriendRequest().mutateAsync
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  const { friends, incoming, outgoing } = data
  const ready = status === 'ready'
  const listRef = useScrollMemory<HTMLDivElement>(`scroll:friends:${tab}`, ready && tab !== 'find')

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => onTabChange(next as SocialSubTab)}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <PageHeader
        title={t('universe.socialPage.sections.friends.label')}
        subtitle={t('universe.socialPage.sections.friends.subtitle')}
        actions={
          ready && tab === 'mine' ? (
            <Button variant="primary" onClick={() => onTabChange('find')}>
              {t('universe.socialPage.addFriend')}
            </Button>
          ) : null
        }
      />
      <SubTabList
        label={t('universe.socialPage.sections.friends.label')}
        current={tab}
        tabs={SOCIAL_SUB_TABS.map((value) => ({
          value,
          label: t(`universe.socialPage.sections.friends.tabs.${value}`),
          pending: value === 'requests' ? incoming.length : 0
        }))}
      />

      <TabsContent value={tab} className="flex min-h-0 flex-1 flex-col gap-4">
        {ready && tab === 'find' ? (
          <PlayerSearch key={activeEnv} />
        ) : (
          <ListPanel ref={listRef}>
            <SocialStateMessage status={status} />

            {ready && tab === 'mine' && (
              <>
                {friends.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    {t('universe.socialPage.emptyFriends')}
                  </p>
                )}
                {friends.map((f) => (
                  <FriendRow key={f.id} friend={f} onOpen={() => openPlayer(f.id)} />
                ))}
              </>
            )}

            {ready && tab === 'requests' && (
              <>
                {incoming.length === 0 && outgoing.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    {t('universe.socialPage.emptyRequests')}
                  </p>
                )}
                {incoming.map((r) => (
                  <RequestRow
                    key={r.id}
                    name={r.name}
                    identity={
                      <PlayerIdentity name={r.name} onOpen={() => openPlayer(r.playerId)} />
                    }
                    kind="incoming"
                    onAccept={() => acceptRequest(r.id)}
                    onDecline={() => declineRequest(r.id)}
                  />
                ))}
                {outgoing.length > 0 && (
                  <p className="ds-section-label px-3 pt-2">
                    {t('universe.socialPage.request.sentTitle')}
                  </p>
                )}
                {outgoing.map((r) => (
                  <RequestRow
                    key={r.id}
                    name={r.name}
                    identity={
                      <PlayerIdentity name={r.name} onOpen={() => openPlayer(r.playerId)} />
                    }
                    kind="outgoing"
                    onDecline={() => declineRequest(r.id)}
                  />
                ))}
              </>
            )}
          </ListPanel>
        )}
      </TabsContent>
    </Tabs>
  )
}
