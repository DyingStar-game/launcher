import { useTranslation } from 'react-i18next'
import type { OrganisationProfile } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import OrganisationLink from '@components/molecules/OrganisationLink'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import SheetSection from '@components/molecules/SheetSection'

export type OrganisationRelationsProps = {
  organisation: OrganisationProfile
}

/** CEO, holding company and subsidiaries of an organisation, each opening its page. */
export default function OrganisationRelations({
  organisation
}: OrganisationRelationsProps): React.JSX.Element {
  const { t } = useTranslation()
  const { openPlayer, openOrganisation } = useNavigationStore()
  const { ceo, parent } = organisation

  return (
    <>
      {ceo && (
        <SheetSection title={t('universe.socialPage.organisation.ceoTitle')}>
          <PlayerIdentity name={ceo.name} onOpen={() => openPlayer(ceo.id)} />
        </SheetSection>
      )}

      {parent && (
        <SheetSection title={t('universe.socialPage.organisation.parent')}>
          <div className="flex">
            <OrganisationLink organisation={parent} onOpen={() => openOrganisation(parent.id)} />
          </div>
        </SheetSection>
      )}

      {organisation.subsidiaries.length > 0 && (
        <SheetSection
          title={t('universe.socialPage.organisation.subsidiaries', {
            count: organisation.subsidiaryCount
          })}
        >
          <ul className="flex flex-col gap-1">
            {organisation.subsidiaries.map((s) => (
              <li key={s.id} className="flex items-baseline gap-2">
                <OrganisationLink organisation={s} onOpen={() => openOrganisation(s.id)} />
                <span className="text-xs text-ds-muted">
                  {t('universe.socialPage.orga.members', { count: s.members })}
                </span>
              </li>
            ))}
          </ul>
        </SheetSection>
      )}
    </>
  )
}
