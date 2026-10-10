import { useTranslation } from 'react-i18next'
import type { OrganisationRef } from '@shared/types/social'
import { UiSoundProfile } from '@shared/types/sounds'
import Button from '@components/atoms/Button'

type Props = {
  organisation: OrganisationRef
  /** Opens the organisation's sheet (ADR 0010). */
  onOpen: () => void
}

/** Organisation name and ticker, as a button opening its sheet. */
export default function OrganisationLink({ organisation, onOpen }: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Button
      variant="name"
      size="none"
      soundProfile={UiSoundProfile.None}
      onClick={onOpen}
      aria-label={t('universe.socialPage.organisation.openAria', { name: organisation.name })}
      className="block min-w-0 truncate text-left"
    >
      {organisation.name}{' '}
      <span className="text-xs font-normal text-[var(--color-ds-muted)]">
        [{organisation.ticker}]
      </span>
    </Button>
  )
}
