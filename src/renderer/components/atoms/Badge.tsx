type Props = {
  /** `accent` for a positive state (e.g. member), `muted` otherwise. */
  variant?: 'muted' | 'accent'
  children: React.ReactNode
}

const variants = {
  muted: 'border-[var(--color-ds-border)] text-[var(--color-ds-muted)]',
  accent:
    'border-[var(--color-ds-accent)]/30 bg-[var(--color-ds-accent)]/10 text-[var(--color-ds-accent)]'
} as const

/** Small uppercase status pill, the read-only counterpart of a `chip` button. */
export default function Badge({ variant = 'muted', children }: Props): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-[0.15em] ${variants[variant]}`}
    >
      {children}
    </span>
  )
}
