import { cva, type VariantProps } from 'class-variance-authority'
import type { FriendStatus } from '@shared/types/social'
import { PRESENCE_COLOR } from '@lib/presence'
import { cn } from '@lib/cn'

const avatarVariants = cva('bg-ds-border flex items-center justify-center', {
  variants: {
    size: { xs: 'size-6 text-2xs', sm: 'size-8 text-xs', lg: 'size-14 text-lg' },
    /** Round for players, rounded square for organisations. */
    shape: { circle: 'rounded-full', square: 'rounded-xl' }
  },
  defaultVariants: { size: 'sm', shape: 'circle' }
})

const dotVariants = cva('absolute bottom-0 right-0 rounded-full border border-ds-surface', {
  variants: { size: { xs: 'size-2', sm: 'size-2.5', lg: 'size-3' } },
  defaultVariants: { size: 'sm' }
})

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  /** Name whose first letter is shown, unless `label` is given. */
  name: string
  /** Text shown instead of the initial (e.g. an organisation ticker). */
  label?: string
  /** Presence dot in the corner. */
  status?: FriendStatus
}

/** Initial (or short label) in a placeholder avatar, with an optional presence dot. */
export default function Avatar({
  name,
  label,
  size,
  shape,
  status
}: AvatarProps): React.JSX.Element {
  return (
    <div className="relative shrink-0">
      <div className={avatarVariants({ size, shape })}>
        <span className="font-semibold text-ds-muted select-none uppercase">
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
