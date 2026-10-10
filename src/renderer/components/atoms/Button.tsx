import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2Icon } from 'lucide-react'
import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

/**
 * Variants (ADR 0015, 0017): boxed (`primary` … `outline`, `outline-danger` for the window close
 * button), `link` (small text action), `name` (a name opening its page), `subtle` (takes the
 * colour of its container, e.g. an alert's close button) and `bare` (no style: clickable content
 * laid out by the caller). Callers' `className` is for layout only (ADR 0017). Sizes: text (`chip`, `sm`, `md`), square
 * icon (`icon`, `icon-sm`, `icon-xs`) and `none` (no padding).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-lg ' +
    'transition-colors focus:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-[var(--color-ds-accent)]/30 focus-visible:ring-offset-0 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'border bg-[var(--color-ds-accent)] text-black ' +
          'border-[var(--color-ds-accent)]/50 hover:brightness-110',
        secondary:
          'border bg-[var(--color-ds-surface-hover)]/40 ' +
          'text-[var(--color-ds-text)] border-[var(--color-ds-border)] ' +
          'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-accent)]/35',
        danger:
          'border bg-[var(--color-ds-danger)]/10 text-red-100 ' +
          'border-[var(--color-ds-danger)]/25 ' +
          'hover:bg-[var(--color-ds-danger)]/15 hover:border-[var(--color-ds-danger)]/40',
        success:
          'border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ' +
          'hover:bg-emerald-500/20 hover:border-emerald-500/60',
        ghost:
          'border bg-transparent text-[var(--color-ds-muted)] ' +
          'border-transparent hover:bg-[var(--color-ds-surface-hover)] ' +
          'hover:border-[var(--color-ds-border)] hover:text-[var(--color-ds-text)]',
        outline:
          'border bg-transparent text-[var(--color-ds-muted)] ' +
          'border-[var(--color-ds-border)] hover:border-[var(--color-ds-accent)]/60 ' +
          'hover:text-[var(--color-ds-text)] hover:bg-white/4 ' +
          'aria-expanded:border-[var(--color-ds-accent)]/40 aria-expanded:bg-white/5',
        'outline-danger':
          'border bg-transparent text-[var(--color-ds-muted)] border-[var(--color-ds-border)] ' +
          'hover:border-red-500/40 hover:text-red-300 hover:bg-white/4',
        link: 'text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)]',
        name: 'text-sm font-medium text-[var(--color-ds-text)] hover:underline',
        subtle: 'text-current opacity-50 hover:opacity-100',
        bare: ''
      },
      size: {
        chip: 'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
        // Fixed height, like the icon sizes: text and icon buttons line up at 36px
        sm: 'h-9 px-3 text-sm font-semibold',
        md: 'h-9 px-4 text-sm font-semibold',
        icon: 'h-9 w-9 shrink-0',
        'icon-sm': 'h-7 w-7 shrink-0',
        'icon-xs': 'p-1.5 shrink-0',
        none: ''
      }
    },
    // Text variants carry no box: whatever the size, no padding and their own text size
    compoundVariants: [
      { variant: ['link', 'name', 'subtle'], className: 'p-0' },
      { variant: 'link', className: 'text-xs font-normal' },
      { variant: 'name', className: 'text-sm font-medium' },
      { variant: 'subtle', className: 'font-normal' }
    ],
    defaultVariants: { variant: 'secondary', size: 'md' }
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Hover/click SFX profile (`none` disables sounds for this button). */
    soundProfile?: UiSoundProfileType
    /** Waiting for an answer (ADR 0018): disabled, same size, a spinner instead of the label. */
    loading?: boolean
  }

/** Themed button (variants and sizes through `cva`) with optional UI sounds. */
export default function Button({
  variant,
  size,
  soundProfile = UiSoundProfile.Default,
  className,
  type = 'button',
  disabled,
  loading = false,
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...props
}: Props): React.JSX.Element {
  const soundHandlers = useUiSound(soundProfile, { disabled: Boolean(disabled) || loading })
  const merged = mergeSoundHandlers(soundHandlers, { onMouseEnter, onMouseLeave, onClick })

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), loading && 'relative', className)}
      onMouseEnter={merged.onMouseEnter}
      onMouseLeave={merged.onMouseLeave}
      onClick={merged.onClick}
      {...props}
    >
      {loading ? (
        <>
          {/* The label stays (transparent, still read by screen readers) so the width does not change */}
          <span className="inline-flex items-center gap-2 opacity-0">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex animate-spin">
              <Loader2Icon className="size-4" aria-hidden="true" />
            </span>
          </span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
