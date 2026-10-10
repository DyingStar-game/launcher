import { useTranslation } from 'react-i18next'
import type { Membership, OrganisationProfile } from '@shared/types/social'
import { can } from '@shared/organisationRights'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { usePageState } from '@hooks/usePageState'
import { useOrganisation } from '@hooks/social/useSocialSheets'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import BackButton from '@components/molecules/BackButton'
import { DetailHeaderSkeleton } from '@components/molecules/DetailSkeleton'
import PageHeader from '@components/molecules/PageHeader'
import SubTabList from '@components/molecules/SubTabList'
import TextSkeleton from '@components/molecules/TextSkeleton'
import OrganisationDetailsForm from '@components/organisms/social/OrganisationDetailsForm'
import OrganisationInvitationsManage from '@components/organisms/social/OrganisationInvitationsManage'
import OrganisationLeadership from '@components/organisms/social/OrganisationLeadership'
import OrganisationMembersManage from '@components/organisms/social/OrganisationMembersManage'
import OrganisationRanksManage from '@components/organisms/social/OrganisationRanksManage'
import DetailPageLayout from '@components/templates/DetailPageLayout'
import { Tabs, TabsContent } from '@components/ui/tabs'

type ManageTab = 'details' | 'invitations' | 'members' | 'ranks' | 'leadership'

/** Tabs a rank opens (ADR 0021), in order. */
function tabsFor(rank: Membership['rank']): ManageTab[] {
  const tabs: [ManageTab, boolean][] = [
    ['details', can(rank, 'manage_corporation')],
    ['invitations', can(rank, 'invite')],
    ['members', can(rank, 'manage_members')],
    ['ranks', can(rank, 'manage_ranks')],
    ['leadership', rank.isCeo]
  ]
  return tabs.filter(([, allowed]) => allowed).map(([tab]) => tab)
}

/**
 * Management page of one of the player's organisations (ADR 0021): a tab per area their rank
 * opens — details, invitations sent, members, ranks, leadership. Back restores the tab.
 */
export default function OrganisationManagePage(): React.JSX.Element {
  const { t } = useTranslation()
  const { subject, back } = useNavigationStore()
  const state = useOrganisation(subject)
  const { data: social } = useSocialSnapshot()
  const showSkeleton = useDelayedFlag(state.kind === 'loading')
  const backButton = <BackButton onBack={back} />
  const membership = social.memberships.find((m) => m.id === subject?.id)

  if (state.kind === 'error') {
    return (
      <DetailPageLayout
        back={backButton}
        header={null}
        placeholder={<p className="text-sm text-red-400">{state.message}</p>}
      />
    )
  }
  if (state.kind !== 'loaded' || !subject) {
    return (
      <DetailPageLayout
        back={backButton}
        header={showSkeleton ? <DetailHeaderSkeleton avatar="square" /> : null}
        main={showSkeleton ? <TextSkeleton lines={6} /> : null}
      />
    )
  }

  return (
    <DetailPageLayout
      back={backButton}
      header={
        <PageHeader
          title={t('universe.socialPage.manage.title', { name: state.data.name })}
          subtitle={t('universe.socialPage.manage.subtitle')}
        />
      }
      placeholder={
        membership && tabsFor(membership.rank).length > 0 ? undefined : (
          <p className="text-sm text-[var(--color-ds-muted)]">
            {t('universe.socialPage.manage.noRight')}
          </p>
        )
      }
      main={
        membership && (
          <ManageTabs
            subject={subject}
            organisation={state.data}
            membership={membership}
            selfId={social.selfId}
          />
        )
      }
    />
  )
}

/** The tabs of the management page, from the player's rank. */
function ManageTabs({
  subject,
  organisation,
  membership,
  selfId
}: {
  subject: Subject
  organisation: OrganisationProfile
  membership: Membership
  selfId: string
}): React.JSX.Element {
  const { t } = useTranslation()
  const tabs = tabsFor(membership.rank)
  const [stored, setTab] = usePageState<ManageTab>('tab', tabs[0])
  const tab = tabs.includes(stored) ? stored : tabs[0]

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => setTab(next as ManageTab)}
      className="flex flex-col gap-4"
    >
      <SubTabList
        label={t('universe.socialPage.manage.title', { name: organisation.name })}
        current={tab}
        tabs={tabs.map((value) => ({
          value,
          label: t(`universe.socialPage.manage.tabs.${value}`)
        }))}
      />
      <TabsContent value={tab} className="flex flex-col gap-4">
        {tab === 'details' && <OrganisationDetailsForm organisation={organisation} />}
        {tab === 'invitations' && <OrganisationInvitationsManage subject={subject} />}
        {tab === 'members' && (
          <OrganisationMembersManage subject={subject} myRank={membership.rank} selfId={selfId} />
        )}
        {tab === 'ranks' && <OrganisationRanksManage subject={subject} myRank={membership.rank} />}
        {tab === 'leadership' && (
          <OrganisationLeadership subject={subject} organisation={organisation} selfId={selfId} />
        )}
      </TabsContent>
    </Tabs>
  )
}
