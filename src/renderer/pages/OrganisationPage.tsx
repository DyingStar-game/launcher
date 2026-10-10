import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '@stores/navigation'
import { useSocialStore } from '@stores/social'
import { useSocialResource } from '@hooks/useSocialResource'
import { useScrollMemory } from '@hooks/usePageState'
import BackButton from '@components/molecules/BackButton'
import SheetSection from '@components/molecules/SheetSection'
import SheetStat from '@components/molecules/SheetStat'
import OrganisationHeader from '@components/organisms/social/OrganisationHeader'
import OrganisationMembers from '@components/organisms/social/OrganisationMembers'
import OrganisationRelations from '@components/organisms/social/OrganisationRelations'
import DetailPageLayout from '@components/templates/DetailPageLayout'
import { DetailHeaderSkeleton, StatsSkeleton } from '@components/molecules/DetailSkeleton'
import TextSkeleton from '@components/molecules/TextSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

/** Organisation page (ADR 0012): identity and join action, figures, description and members, relations. */
export default function OrganisationPage(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { subject, back } = useNavigationStore()
  const getOrganisation = useSocialStore((s) => s.getOrganisation)
  const state = useSocialResource(subject, getOrganisation)
  const showSkeleton = useDelayedFlag(state.kind === 'loading')
  const backButton = <BackButton onBack={back} />
  // Scroll is restored once the members loaded before are back (ADR 0013)
  const [membersRestored, setMembersRestored] = useState(false)
  const handleMembersRestored = useCallback(() => setMembersRestored(true), [])
  const scrollRef = useScrollMemory<HTMLDivElement>(
    'scroll',
    state.kind === 'loaded' && membersRestored
  )

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
    // Skeleton of the page while it loads, after a short delay (ADR 0018)
    return (
      <DetailPageLayout
        back={backButton}
        header={showSkeleton ? <DetailHeaderSkeleton avatar="square" /> : null}
        stats={showSkeleton ? <StatsSkeleton /> : null}
        main={showSkeleton ? <TextSkeleton lines={5} /> : null}
        aside={showSkeleton ? <TextSkeleton lines={3} /> : null}
      />
    )
  }

  const organisation = state.data
  const createdAt = new Date(organisation.createdAt).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <DetailPageLayout
      scrollRef={scrollRef}
      back={backButton}
      header={<OrganisationHeader organisation={organisation} />}
      stats={
        <dl className="grid grid-cols-2 gap-3">
          <SheetStat
            label={t('universe.socialPage.organisation.members')}
            value={organisation.members}
          />
          <SheetStat label={t('universe.socialPage.organisation.createdAt')} value={createdAt} />
        </dl>
      }
      main={
        <>
          {organisation.description && (
            <SheetSection title={t('universe.socialPage.organisation.description')}>
              <p className="text-sm text-[var(--color-ds-text)] whitespace-pre-line">
                {organisation.description}
              </p>
            </SheetSection>
          )}
          <OrganisationMembers subject={subject} onRestored={handleMembersRestored} />
        </>
      }
      aside={<OrganisationRelations organisation={organisation} />}
    />
  )
}
