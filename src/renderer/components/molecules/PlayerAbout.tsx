import { useTranslation } from 'react-i18next'
import type { PlayerProfile } from '@shared/types/social'
import BBCodeText from './BBCodeText'
import SheetSection from './SheetSection'

export type PlayerAboutProps = { profile: PlayerProfile }

/** Biography and role-play sheet of a player; parts without data are not shown. */
export default function PlayerAbout({ profile }: PlayerAboutProps): React.JSX.Element {
  const { t } = useTranslation()
  const hasRpSheet = Boolean(profile.characterName || profile.alignment || profile.story)

  return (
    <>
      {profile.biography && (
        <SheetSection title={t('universe.socialPage.profile.biography')}>
          <BBCodeText text={profile.biography} />
        </SheetSection>
      )}
      {hasRpSheet && (
        <SheetSection title={t('universe.socialPage.profile.rpSheet')}>
          {profile.characterName && (
            <p className="text-sm text-ds-text">
              <span className="text-ds-muted">
                {t('universe.socialPage.profile.characterName')}{' '}
              </span>
              {profile.characterName}
            </p>
          )}
          {profile.alignment && (
            <p className="text-sm text-ds-text">
              <span className="text-ds-muted">{t('universe.socialPage.profile.alignment')} </span>
              {profile.alignment}
            </p>
          )}
          {profile.story && (
            <div className="mt-1">
              <BBCodeText text={profile.story} />
            </div>
          )}
        </SheetSection>
      )}
      {!profile.biography && !hasRpSheet && (
        <p className="text-sm text-ds-muted">{t('universe.socialPage.profile.empty')}</p>
      )}
    </>
  )
}
