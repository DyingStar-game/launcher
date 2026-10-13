import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '@stores/navigation'
import { usePlayer } from '@hooks/social/useSocialSheets'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import BackButton from '@components/molecules/BackButton'
import { DetailHeaderSkeleton } from '@components/molecules/DetailSkeleton'
import PageHeader from '@components/molecules/PageHeader'
import TextSkeleton from '@components/molecules/TextSkeleton'
import ProfileEditForm from '@components/organisms/social/ProfileEditForm'
import DetailPageLayout from '@components/templates/DetailPageLayout'

/** Edit page of the player's own profile (ADR 0020), opened from their sheet; Back returns to it. */
export default function ProfileEditPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { subject, back } = useNavigationStore()
  const state = usePlayer(subject)
  const showSkeleton = useDelayedFlag(state.kind === 'loading')
  const backButton = <BackButton onBack={back} />

  if (state.kind === 'error') {
    return (
      <DetailPageLayout
        back={backButton}
        header={null}
        placeholder={<p className="text-sm text-red-400">{state.message}</p>}
      />
    )
  }

  if (state.kind !== 'loaded') {
    return (
      <DetailPageLayout
        back={backButton}
        header={showSkeleton ? <DetailHeaderSkeleton avatar="circle" /> : null}
        main={showSkeleton ? <TextSkeleton lines={6} /> : null}
      />
    )
  }

  return (
    <DetailPageLayout
      back={backButton}
      header={
        <PageHeader
          title={t('universe.socialPage.profileEdit.title')}
          subtitle={t('universe.socialPage.profileEdit.subtitle')}
        />
      }
      main={<ProfileEditForm profile={state.data} onDone={back} />}
    />
  )
}
