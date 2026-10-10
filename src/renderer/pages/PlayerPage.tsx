import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '@stores/navigation'
import { useSocialStore } from '@stores/social'
import { useSocialResource } from '@hooks/useSocialResource'
import { useScrollMemory } from '@hooks/usePageState'
import BackButton from '@components/molecules/BackButton'
import PlayerAbout from '@components/molecules/PlayerAbout'
import SheetStat from '@components/molecules/SheetStat'
import PlayerAffiliations from '@components/organisms/social/PlayerAffiliations'
import PlayerHeader from '@components/organisms/social/PlayerHeader'
import DetailPageLayout from '@components/templates/DetailPageLayout'

/** Player page (ADR 0012): identity and friend action, figures, about, affiliations. */
export default function PlayerPage(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { subject, back } = useNavigationStore()
  const getPlayer = useSocialStore((s) => s.getPlayer)
  const state = useSocialResource(subject, getPlayer)
  const backButton = <BackButton onBack={back} />
  const scrollRef = useScrollMemory<HTMLDivElement>('scroll', state.kind === 'loaded')

  if (state.kind !== 'loaded') {
    return (
      <DetailPageLayout
        back={backButton}
        header={null}
        placeholder={
          <p
            className={`text-sm ${state.kind === 'error' ? 'text-red-400' : 'text-[var(--color-ds-muted)]'}`}
          >
            {state.kind === 'error' ? state.message : t('universe.socialPage.state.loading')}
          </p>
        }
      />
    )
  }

  const profile = state.data
  const memberSince = new Date(profile.memberSince).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <DetailPageLayout
      scrollRef={scrollRef}
      back={backButton}
      header={<PlayerHeader profile={profile} />}
      stats={
        <dl className="grid grid-cols-3 gap-3">
          <SheetStat
            label={t('universe.socialPage.profile.reputation')}
            value={profile.reputation}
          />
          <SheetStat
            label={t('universe.socialPage.profile.playtime')}
            value={t('universe.socialPage.profile.hours', { count: profile.playtimeHours })}
          />
          <SheetStat label={t('universe.socialPage.profile.memberSince')} value={memberSince} />
        </dl>
      }
      main={<PlayerAbout profile={profile} />}
      aside={<PlayerAffiliations profile={profile} />}
    />
  )
}
