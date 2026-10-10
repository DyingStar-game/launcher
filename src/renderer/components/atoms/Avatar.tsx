import { cva } from 'class-variance-authority'
import type { FriendStatus } from '@shared/types/social'
import { PRESENCE_COLOR } from '@lib/presence'
import { cn } from '@lib/cn'

type Props = {
  /** Name whose first letter is shown, unless `label` is given. */
  name: string
  /** Text shown instead of the initial (e.g. an organisation ticker). */
  label?: string
  size?: 'sm' | 'lg'
  /** Round for players, rounded square for organisations. */
  shape?: 'circle' | 'square'
  /** Presence dot in the corner. */
  status?: FriendStatus
}

const avatarVariants = cva('bg-[var(--color-ds-border)] flex items-center justify-center', {
  variants: {
    size: { sm: 'w-8 h-8 text-xs', lg: 'w-14 h-14 text-lg' },
    shape: { circle: 'rounded-full', square: 'rounded-xl' }
  }
})

const dotVariants = cva(
  'absolute bottom-0 right-0 rounded-full border border-[var(--color-ds-surface)]',
  { variants: { size: { sm: 'w-2.5 h-2.5', lg: 'w-3 h-3' } } }
)

/** Initial (or short label) in a placeholder avatar, with an optional presence dot. */
export default function Avatar({
  name,
  label,
  size = 'sm',
  shape = 'circle',
  status
}: Props): React.JSX.Element {
  return (
    <div className="relative shrink-0">
      <div className={avatarVariants({ size, shape })}>
        <span className="font-semibold text-[var(--color-ds-muted)] select-none uppercase">
          {label ?? name.charAt(0)}
        </span>
      </div>
      {status && (
        <span
          data-testid="presence-dot"
          data-status={status}
          className={cn(dotVariants({ size }), PRESENCE_COLOR[status])}
        />
      )}
    </div>
  )
}
