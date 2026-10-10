import type { FriendStatus } from '@shared/types/social'
import { PRESENCE_COLOR } from '@lib/presence'

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

const sizes = {
  sm: { box: 'w-8 h-8 text-xs', dot: 'w-2.5 h-2.5' },
  lg: { box: 'w-14 h-14 text-lg', dot: 'w-3 h-3' }
} as const

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
      <div
        className={`${sizes[size].box} ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'} bg-[var(--color-ds-border)] flex items-center justify-center`}
      >
        <span className="font-semibold text-[var(--color-ds-muted)] select-none uppercase">
          {label ?? name.charAt(0)}
        </span>
      </div>
      {status && (
        <span
          data-testid="presence-dot"
          data-status={status}
          className={`absolute bottom-0 right-0 ${sizes[size].dot} rounded-full border border-[var(--color-ds-surface)] ${PRESENCE_COLOR[status]}`}
        />
      )}
    </div>
  )
}
