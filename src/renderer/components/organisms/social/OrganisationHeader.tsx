import { useTranslation } from 'react-i18next'
import type { OrganisationProfile } from '@shared/types/social'
import Avatar from '@components/atoms/Avatar'
import OrganisationAction from './OrganisationAction'

/** Identity of an organisation page (ADR 0012): ticker avatar, name, recruitment, join action. */
export default function OrganisationHeader({
  organisation
}: {
  organisation: OrganisationProfile
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-4">
      <Avatar
        name={organisation.name}
        label={organisation.ticker.slice(0, 3)}
        size="lg"
        shape="square"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-[var(--color-ds-text)] truncate">
          {organisation.name}{' '}
          <span className="text-base font-normal text-[var(--color-ds-muted)]">
            [{organisation.ticker}]
          </span>
        </h1>
        <p className="text-xs text-[var(--color-ds-muted)]">
          {t(`universe.socialPage.organisation.recruitment.${organisation.recruitment}`)}
        </p>
      </div>
      <OrganisationAction
        id={organisation.id}
        name={organisation.name}
        recruitment={organisation.recruitment}
      />
    </div>
  )
}
