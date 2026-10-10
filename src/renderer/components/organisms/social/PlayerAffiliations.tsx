import { useTranslation } from 'react-i18next'
import type { PlayerProfile } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import OrganisationLink from '@components/molecules/OrganisationLink'
import SheetSection from '@components/molecules/SheetSection'

/** Organisations (opening their page) and political entities of a player. */
export default function PlayerAffiliations({
  profile
}: {
  profile: PlayerProfile
}): React.JSX.Element {
  const { t } = useTranslation()
  const openOrganisation = useNavigationStore((s) => s.openOrganisation)

  return (
    <>
      <SheetSection title={t('universe.socialPage.profile.corporations')}>
        {profile.corporations.length === 0 ? (
          <p className="text-sm text-[var(--color-ds-muted)]">
            {t('universe.socialPage.profile.noCorporation')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {profile.corporations.map((c) => (
              <li key={c.id} className="flex">
                <OrganisationLink organisation={c} onOpen={() => openOrganisation(c.id)} />
              </li>
            ))}
          </ul>
        )}
      </SheetSection>

      {profile.politics.length > 0 && (
        <SheetSection title={t('universe.socialPage.profile.politics')}>
          <ul className="flex flex-col gap-1">
            {profile.politics.map((p) => (
              <li key={p.id} className="text-sm text-[var(--color-ds-text)]">
                {p.name}{' '}
                <span className="text-xs text-[var(--color-ds-muted)]">
                  {t(`universe.socialPage.profile.politicalTypes.${p.type}`, {
                    defaultValue: p.type
                  })}
                </span>
              </li>
            ))}
          </ul>
        </SheetSection>
      )}
    </>
  )
}
