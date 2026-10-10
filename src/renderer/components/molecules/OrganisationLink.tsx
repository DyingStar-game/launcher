import { useTranslation } from 'react-i18next'
import type { OrganisationRef } from '@shared/types/social'

type Props = {
  organisation: OrganisationRef
  /** Opens the organisation's sheet (ADR 0010). */
  onOpen: () => void
}

/** Organisation name and ticker, as a button opening its sheet. */
export default function OrganisationLink({ organisation, onOpen }: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('universe.socialPage.organisation.openAria', { name: organisation.name })}
      className="min-w-0 truncate text-left text-sm font-medium text-[var(--color-ds-text)] hover:underline cursor-pointer"
    >
      {organisation.name}{' '}
      <span className="text-xs font-normal text-[var(--color-ds-muted)]">
        [{organisation.ticker}]
      </span>
    </button>
  )
}
