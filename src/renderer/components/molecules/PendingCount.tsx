import { useTranslation } from 'react-i18next'
import { Badge } from '@components/ui/badge'

export type PendingCountProps = {
  count: number
  /** The count read as a sentence; requests waiting by default. */
  label?: string
}

/** A number waiting for the player (requests, ADR 0023; unread versions): a pill, read as a sentence. Nothing at 0. */
export default function PendingCount({
  count,
  label
}: PendingCountProps): React.JSX.Element | null {
  const { t } = useTranslation()
  if (count <= 0) return null

  return (
    <>
      <Badge aria-hidden="true">{count}</Badge>
      <span className="sr-only">{label ?? t('universe.socialPage.pendingCount', { count })}</span>
    </>
  )
}
