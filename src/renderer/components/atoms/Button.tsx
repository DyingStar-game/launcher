import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

/**
 * Variants (ADR 0015): boxed (`primary` … `outline`), `link` (text action) and `bare` (no
 * style: clickable content laid out by the caller). Sizes: text (`chip`, `sm`, `md`), square
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
          'border active:translate-y-px bg-[var(--color-ds-accent)] text-black ' +
          'border-[var(--color-ds-accent)]/50 hover:brightness-110',
        secondary:
          'border active:translate-y-px bg-[var(--color-ds-surface-hover)]/40 ' +
          'text-[var(--color-ds-text)] border-[var(--color-ds-border)] ' +
          'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-accent)]/35',
        danger:
          'border active:translate-y-px bg-[var(--color-ds-danger)]/10 text-red-100 ' +
          'border-[var(--color-ds-danger)]/25 ' +
          'hover:bg-[var(--color-ds-danger)]/15 hover:border-[var(--color-ds-danger)]/40',
        success:
          'border active:translate-y-px bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ' +
          'hover:bg-emerald-500/20 hover:border-emerald-500/60',
        ghost:
          'border active:translate-y-px bg-transparent text-[var(--color-ds-muted)] ' +
          'border-transparent hover:bg-[var(--color-ds-surface-hover)] ' +
          'hover:border-[var(--color-ds-border)] hover:text-[var(--color-ds-text)]',
        outline:
          'border active:translate-y-px bg-transparent text-[var(--color-ds-muted)] ' +
          'border-[var(--color-ds-border)] hover:border-[var(--color-ds-accent)]/60 ' +
          'hover:text-[var(--color-ds-text)] hover:bg-white/4 ' +
          'aria-expanded:border-[var(--color-ds-accent)]/40 aria-expanded:bg-white/5',
        link: 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)]',
        bare: ''
      },
      size: {
        chip: 'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
        sm: 'px-3 py-2 text-sm font-semibold',
        md: 'px-4 py-2 text-sm font-semibold',
        icon: 'h-9 w-9 shrink-0',
        'icon-sm': 'h-7 w-7 shrink-0',
        'icon-xs': 'p-1.5 shrink-0',
        none: ''
      }
    },
    defaultVariants: { variant: 'secondary', size: 'md' }
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Hover/click SFX profile (`none` disables sounds for this button). */
    soundProfile?: UiSoundProfileType
  }

/** Themed button (variants and sizes through `cva`) with optional UI sounds. */
export default function Button({
  variant,
  size,
  soundProfile = UiSoundProfile.Default,
  className,
  type = 'button',
  disabled,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...props
}: Props): React.JSX.Element {
  const soundHandlers = useUiSound(soundProfile, { disabled: Boolean(disabled) })
  const merged = mergeSoundHandlers(soundHandlers, { onMouseEnter, onMouseLeave, onClick })

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      onMouseEnter={merged.onMouseEnter}
      onMouseLeave={merged.onMouseLeave}
      onClick={merged.onClick}
      {...props}
    />
  )
}
