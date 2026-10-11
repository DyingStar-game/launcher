import type React from 'react'
import { Loader2Icon } from 'lucide-react'
import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'
import { buttonVariants } from '@components/ui/button'

type ShadcnVariant = NonNullable<Parameters<typeof buttonVariants>[0]>['variant']
type ShadcnSize = NonNullable<Parameters<typeof buttonVariants>[0]>['size']

/**
 * The launcher's variant names, each drawn by a shadcn Button variant (ADR 0028). `bare` has no
 * style: clickable content laid out by the caller.
 */
const VARIANTS = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  'outline-danger': 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  success: 'success',
  discord: 'discord',
  link: 'link',
  name: 'link',
  subtle: 'ghost'
} as const satisfies Record<string, ShadcnVariant>

/**
 * The launcher's size names, each a shadcn size: text and icon buttons are 36 px (`lg`,
 * `icon-lg`, ADR 0028); `none` keeps no height nor padding (inline text).
 */
const SIZES = {
  md: 'lg',
  sm: 'lg',
  chip: 'xs',
  icon: 'icon-lg',
  'icon-sm': 'icon-sm',
  'icon-xs': 'icon-xs'
} as const satisfies Record<string, ShadcnSize>

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS | 'bare'
  size?: keyof typeof SIZES | 'none'
  /** Hover/click SFX profile (`none` disables sounds for this button). */
  soundProfile?: UiSoundProfileType
  /** Waiting for an answer (ADR 0018): disabled, same size, a spinner instead of the label. */
  loading?: boolean
}

/**
 * Button: shadcn's Button (ADR 0027, 0028) with the launcher's UI sounds and loading state. The
 * caller's `className` is for layout only (ADR 0017).
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
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
}: ButtonProps): React.JSX.Element {
  const soundHandlers = useUiSound(soundProfile, { disabled: Boolean(disabled) || loading })
  const merged = mergeSoundHandlers(soundHandlers, { onMouseEnter, onMouseLeave, onClick })
  const look =
    variant === 'bare'
      ? // No look, but laid out and focusable like any button: content centred, keyboard ring
        'inline-flex items-center rounded-lg outline-none select-none cursor-pointer ' +
        'focus-visible:ring-3 focus-visible:ring-ring/50 ' +
        'disabled:opacity-50 disabled:cursor-not-allowed'
      : cn(
          buttonVariants({
            variant: VARIANTS[variant],
            size: size === 'none' ? undefined : SIZES[size]
          }),
          size === 'none' && 'h-auto p-0',
          // `subtle` takes its parent's colour instead of the ghost's muted text
          variant === 'subtle' && 'text-current',
          'cursor-pointer'
        )

  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(look, loading && 'relative', className)}
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
