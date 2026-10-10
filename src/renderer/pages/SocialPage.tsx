import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialStore } from '@stores/social'
import { useEnvStore } from '@stores/env'
import { useAccountStore } from '@stores/account'
import { usePageState, useScrollMemory } from '@hooks/usePageState'
import { useNavigationStore } from '@stores/navigation'
import Button from '@components/atoms/Button'
import FriendRow from '@components/molecules/FriendRow'
import OrgaRow from '@components/molecules/OrgaRow'
import PageHeader from '@components/molecules/PageHeader'
import RequestRow from '@components/molecules/RequestRow'
import SocialSidebar from '@components/molecules/SocialSidebar'
import CreateOrganisationForm from '@components/organisms/social/CreateOrganisationForm'
import OrganisationAction from '@components/organisms/social/OrganisationAction'
import OrganisationSearch from '@components/organisms/social/OrganisationSearch'
import PlayerSearch from '@components/organisms/social/PlayerSearch'
import SocialStateMessage from '@components/organisms/social/SocialStateMessage'
import SidebarPageLayout from '@components/templates/SidebarPageLayout'
import { Tabs, TabsContent } from '@components/ui/tabs'

type Tab = 'friends' | 'players' | 'organizations' | 'requests'

/** Full social page: friends, organizations, and friend requests (ADR 0007). */
export default function SocialPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const accountStatus = useAccountStore((s) => s.data[activeEnv].status)
  const { data, fetchAll, acceptRequest, declineRequest } = useSocialStore()
  const { openPlayer, openOrganisation } = useNavigationStore()
  const { friends, incoming, outgoing, organisations, status } = data[activeEnv]
  const ready = status === 'ready'

  const [tab, setTab] = usePageState<Tab>('tab', 'friends')
  const [showCreateOrga, setShowCreateOrga] = useState(false)

  useEffect(() => {
    void fetchAll()
  }, [activeEnv, accountStatus, fetchAll])

  const listRef = useScrollMemory<HTMLDivElement>(`scroll:${tab}`, ready && tab !== 'players')

  const handleTabChange = (next: string): void => {
    setTab(next as Tab)
    setShowCreateOrga(false)
  }

  return (
    // Radix tabs (ADR 0016): the sidebar is the tab list, the content column the tab panel
    <Tabs value={tab} onValueChange={handleTabChange} orientation="vertical" className="contents">
      <SidebarPageLayout sidebar={<SocialSidebar current={tab} />}>
        <TabsContent value={tab} className="flex min-h-0 flex-col gap-4">
          <PageHeader
            title={t(`universe.socialPage.tabs.${tab}.label`)}
            subtitle={t(`universe.socialPage.tabs.${tab}.subtitle`)}
            actions={
              ready && tab === 'friends' ? (
                <Button variant="primary" onClick={() => handleTabChange('players')}>
                  {t('universe.socialPage.addFriend')}
                </Button>
              ) : ready && tab === 'organizations' ? (
                <Button variant="primary" onClick={() => setShowCreateOrga((v) => !v)}>
                  {showCreateOrga ? t('common.cancel') : t('universe.socialPage.createOrga')}
                </Button>
              ) : null
            }
          />

          {ready && showCreateOrga && tab === 'organizations' && (
            <CreateOrganisationForm onClose={() => setShowCreateOrga(false)} />
          )}
          {ready && tab === 'organizations' && !showCreateOrga && (
            <OrganisationSearch key={activeEnv} />
          )}

          {ready && tab === 'requests' && incoming.length > 0 && (
            <p className="text-xs text-[var(--color-ds-muted)]">
              {t('universe.socialPage.pendingRequests', { count: incoming.length })}
            </p>
          )}

          {ready && tab === 'players' && <PlayerSearch key={activeEnv} />}

          {!(ready && tab === 'players') && (
            <div className="ds-panel flex-1 min-h-0 overflow-hidden">
              <div ref={listRef} className="h-full overflow-y-auto p-3 flex flex-col gap-2">
                <SocialStateMessage
                  status={status}
                  avatar={tab === 'organizations' ? 'square' : 'circle'}
                />

                {ready && tab === 'friends' && (
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

                {ready && tab === 'organizations' && (
                  <>
                    {organisations.length === 0 && (
                      <p className="text-sm text-[var(--color-ds-muted)] p-2">
                        {t('universe.socialPage.emptyOrganizations')}
                      </p>
                    )}
                    {organisations.map((o) => (
                      <OrgaRow
                        key={o.id}
                        orga={o}
                        onOpen={() => openOrganisation(o.id)}
                        action={
                          <OrganisationAction id={o.id} name={o.name} recruitment={o.recruitment} />
                        }
                      />
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
                        req={r}
                        direction="incoming"
                        onOpen={() => openPlayer(r.playerId)}
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
                        req={r}
                        direction="outgoing"
                        onOpen={() => openPlayer(r.playerId)}
                        onDecline={() => declineRequest(r.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </SidebarPageLayout>
    </Tabs>
  )
}
