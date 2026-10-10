import { useTranslation } from 'react-i18next'
import { Skeleton } from '@components/ui/skeleton'

/** Skeleton of a detail page header (ADR 0018): large avatar, name and status lines. */
export function DetailHeaderSkeleton({
  avatar = 'circle'
}: {
  /** Round for a player, rounded square for an organisation. */
  avatar?: 'circle' | 'square'
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('common.loadingContent')}
      className="flex items-center gap-4"
    >
      <Skeleton shape={avatar} className="size-14 shrink-0" />
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton shape="line" className="h-6 w-48" />
        <Skeleton shape="line" className="w-32" />
      </div>
    </div>
  )
}

/** Skeleton of a detail page's figures row (ADR 0018): three stat cards. */
export function StatsSkeleton(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} shape="block" className="h-16" />
      ))}
    </div>
  )
}
