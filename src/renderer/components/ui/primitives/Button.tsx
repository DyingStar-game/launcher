import type React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const base =
  'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap ' +
  'rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-[var(--color-ds-accent)]/30 focus-visible:ring-offset-0 ' +
  'active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm font-semibold',
  md: 'px-4 py-2 text-sm font-semibold'
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-ds-accent)] text-black border-[var(--color-ds-accent)]/50 ' +
    'hover:brightness-110',
  secondary:
    'bg-[var(--color-ds-surface-hover)]/40 text-[var(--color-ds-text)] border-[var(--color-ds-border)] ' +
    'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-accent)]/35',
  danger:
    'bg-[var(--color-ds-danger)]/10 text-red-100 border-[var(--color-ds-danger)]/25 ' +
    'hover:bg-[var(--color-ds-danger)]/15 hover:border-[var(--color-ds-danger)]/40',
  ghost:
    'bg-transparent text-[var(--color-ds-muted)] border-transparent ' +
    'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-border)] hover:text-[var(--color-ds-text)]'
}

/** Themed button with primary/secondary/danger/ghost variants. */
export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: Props): React.JSX.Element {
  return (
    <button
      type={type}
      className={[base, sizes[size], variants[variant], className].join(' ')}
      {...props}
    />
  )
}
