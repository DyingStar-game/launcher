import { cva, type VariantProps } from 'class-variance-authority'

type Icon = 'check' | 'pending' | 'lock' | 'self'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
  {
    variants: {
      /** `accent` for a positive state (e.g. member), `muted` otherwise. */
      variant: {
        muted: 'text-[var(--color-ds-muted)]',
        accent: 'text-[var(--color-ds-accent)]'
      }
    },
    defaultVariants: { variant: 'muted' }
  }
)

type Props = VariantProps<typeof badgeVariants> & {
  /** Leading icon telling the kind of state. */
  icon?: Icon
  children: React.ReactNode
}

const iconPaths: Record<Icon, string> = {
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  pending:
    'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
  lock: 'M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6zm9 14H6V10h12v10zm-6-3a2 2 0 100-4 2 2 0 000 4z',
  self: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
}

/**
 * Small uppercase status, read-only: an icon and text with no frame, so it never reads as a
 * `chip` button (which keeps its border).
 */
export default function Badge({ variant, icon, children }: Props): React.JSX.Element {
  return (
    <span className={badgeVariants({ variant })}>
      {icon && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-current">
          <path d={iconPaths[icon]} />
        </svg>
      )}
      {children}
    </span>
  )
}
