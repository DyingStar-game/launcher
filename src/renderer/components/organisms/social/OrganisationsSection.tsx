import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useAnswerApplication, useAnswerInvitation } from '@hooks/social/useSocialActions'
import { useScrollMemory } from '@hooks/usePageState'
import Button from '@components/atoms/Button'
import ListPanel from '@components/molecules/ListPanel'
import OrgaRow from '@components/molecules/OrgaRow'
import OrganisationIdentity from '@components/molecules/OrganisationIdentity'
import PageHeader from '@components/molecules/PageHeader'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import RequestRow from '@components/molecules/RequestRow'
import SubTabList from '@components/molecules/SubTabList'
import { Tabs, TabsContent } from '@components/ui/tabs'
import { SOCIAL_SUB_TABS, pendingCounts, type SocialSubTab } from '@lib/socialSections'
import CreateOrganisationForm from './CreateOrganisationForm'
import OrganisationSearch from './OrganisationSearch'
import SocialStateMessage from './SocialStateMessage'
import SectionLabel from '@components/atoms/SectionLabel'

export type OrganisationsSectionProps = {
  tab: SocialSubTab
  onTabChange: (tab: SocialSubTab) => void
}

/**
 * Organisations section of the social page (ADR 0023, 0024): my organisations (and creating
 * one), the organisation search, then invitations received, applications to answer for the
 * organisations the player recruits for, and applications sent.
 */
export default function OrganisationsSection({
  tab,
  onTabChange
}: OrganisationsSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, status } = useSocialSnapshot()
  const answerInvitation = useAnswerInvitation().mutateAsync
  const answerApplication = useAnswerApplication().mutateAsync
  const { openOrganisation, openPlayer } = useNavigationStore()
  const { memberships, invitations, applications, receivedApplications } = data
  const ready = status === 'ready'
  const [creating, setCreating] = useState(false)
  const listRef = useScrollMemory<HTMLDivElement>(
    `scroll:organisations:${tab}`,
    ready && tab !== 'find'
  )

  const changeTab = (next: SocialSubTab): void => {
    setCreating(false)
    onTabChange(next)
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => changeTab(next as SocialSubTab)}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <PageHeader
        title={t('universe.socialPage.sections.organisations.label')}
        subtitle={t('universe.socialPage.sections.organisations.subtitle')}
        actions={
          ready && tab === 'mine' ? (
            <Button variant="primary" onClick={() => setCreating((v) => !v)}>
              {creating ? t('common.cancel') : t('universe.socialPage.createOrga')}
            </Button>
          ) : null
        }
      />
      <SubTabList
        label={t('universe.socialPage.sections.organisations.label')}
        current={tab}
        tabs={SOCIAL_SUB_TABS.map((value) => ({
          value,
          label: t(`universe.socialPage.sections.organisations.tabs.${value}`),
          pending: value === 'requests' ? pendingCounts(data).organisations : 0
        }))}
      />

      <TabsContent value={tab} className="flex min-h-0 flex-1 flex-col gap-4">
        {ready && tab === 'mine' && creating && (
          <CreateOrganisationForm onClose={() => setCreating(false)} />
        )}
        {ready && tab === 'find' ? (
          <OrganisationSearch key={activeEnv} />
        ) : (
          <ListPanel ref={listRef}>
            <SocialStateMessage status={status} avatar="square" />

            {ready && tab === 'mine' && (
              <>
                {memberships.length === 0 && (
                  <p className="text-sm text-ds-muted p-2">
                    {t('universe.socialPage.emptyMyOrganisations')}
                  </p>
                )}
                {memberships.map((m) => (
                  <OrgaRow
                    key={m.id}
                    orga={m}
                    detail={m.rank.name}
                    onOpen={() => openOrganisation(m.id)}
                  />
                ))}
              </>
            )}

            {ready && tab === 'requests' && (
              <>
                {invitations.length === 0 &&
                  applications.length === 0 &&
                  receivedApplications.length === 0 && (
                    <p className="text-sm text-ds-muted p-2">
                      {t('universe.socialPage.emptyOrganisationRequests')}
                    </p>
                  )}
                {invitations.length > 0 && (
                  <SectionLabel className="px-3 pt-2">
                    {t('universe.socialPage.request.invitationsTitle')}
                  </SectionLabel>
                )}
                {invitations.map((r) => (
                  <RequestRow
                    key={r.id}
                    name={r.organisation.name}
                    identity={
                      <OrganisationIdentity
                        organisation={r.organisation}
                        onOpen={() => openOrganisation(r.organisation.id)}
                      />
                    }
                    kind="invitation"
                    onAccept={() => answerInvitation({ requestId: r.id, accept: true })}
                    onDecline={() => answerInvitation({ requestId: r.id, accept: false })}
                  />
                ))}
                {receivedApplications.map((group) => (
                  <Fragment key={group.organisation.id}>
                    <SectionLabel className="px-3 pt-2">
                      {t('universe.socialPage.request.receivedTitle', {
                        name: group.organisation.name,
                        ticker: group.organisation.ticker
                      })}
                    </SectionLabel>
                    {group.applications.map((a) => (
                      <RequestRow
                        key={a.id}
                        name={a.player.name}
                        identity={
                          <PlayerIdentity
                            name={a.player.name}
                            onOpen={() => openPlayer(a.player.id)}
                          >
                            {a.message && (
                              <span className="text-xs text-ds-muted line-clamp-2">
                                {a.message}
                              </span>
                            )}
                          </PlayerIdentity>
                        }
                        kind="received"
                        onAccept={() =>
                          answerApplication({
                            organisationId: group.organisation.id,
                            requestId: a.id,
                            accept: true
                          })
                        }
                        onDecline={() =>
                          answerApplication({
                            organisationId: group.organisation.id,
                            requestId: a.id,
                            accept: false
                          })
                        }
                      />
                    ))}
                  </Fragment>
                ))}
                {applications.length > 0 && (
                  <SectionLabel className="px-3 pt-2">
                    {t('universe.socialPage.request.applicationsTitle')}
                  </SectionLabel>
                )}
                {applications.map((r) => (
                  <RequestRow
                    key={r.id}
                    name={r.organisation.name}
                    identity={
                      <OrganisationIdentity
                        organisation={r.organisation}
                        onOpen={() => openOrganisation(r.organisation.id)}
                      />
                    }
                    kind="application"
                    onDecline={() => answerInvitation({ requestId: r.id, accept: false })}
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
