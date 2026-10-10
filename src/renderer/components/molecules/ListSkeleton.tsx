import { useTranslation } from 'react-i18next'
import { Skeleton } from '@components/ui/skeleton'

type RowProps = {
  /** Avatar shape: round for players, rounded square for organisations. */
  avatar?: 'circle' | 'square'
  /** A chip-sized block on the right, for rows with an action. */
  action?: boolean
}

/** Skeleton of a list row (ADR 0018): avatar, name and detail lines, optional action. */
export function RowSkeleton({ avatar = 'circle', action = false }: RowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton shape={avatar} className="size-8 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton shape="line" className="w-32" />
        <Skeleton shape="line" className="h-2.5 w-20" />
      </div>
      {action && <Skeleton shape="block" className="h-6 w-16 shrink-0" />}
    </div>
  )
}

type Props = RowProps & {
  /** Number of placeholder rows. */
  rows?: number
}

/** Skeleton of a list while it loads (ADR 0018), announced as loading content. */
export default function ListSkeleton({ rows = 3, ...row }: Props): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('common.loadingContent')}
      className="flex flex-col gap-2"
    >
      {Array.from({ length: rows }, (_, index) => (
        <RowSkeleton key={index} {...row} />
      ))}
    </div>
  )
}
