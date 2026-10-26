import { useTranslation } from 'react-i18next'

export type UnreadDotProps = {
  /** Read by screen readers; "New" by default. */
  label?: string
}

/** Something not read yet, in a list too narrow for a badge (ADR 0046): a dot, read as a word. */
export default function UnreadDot({ label }: UnreadDotProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-primary" />
      <span className="sr-only">{label ?? t('changelog.new')}</span>
    </>
  )
}
