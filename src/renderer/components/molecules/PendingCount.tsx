import { useTranslation } from 'react-i18next'
import { Badge } from '@components/ui/badge'

/** Number of requests waiting for the player (ADR 0023): a pill, read as a sentence. Nothing at 0. */
export default function PendingCount({ count }: { count: number }): React.JSX.Element | null {
  const { t } = useTranslation()
  if (count <= 0) return null

  return (
    <>
      <Badge aria-hidden="true">{count}</Badge>
      <span className="sr-only">{t('universe.socialPage.pendingCount', { count })}</span>
    </>
  )
}
