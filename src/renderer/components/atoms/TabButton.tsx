import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

const tabVariants = cva(
  'relative px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors cursor-pointer',
  {
    variants: {
      /** `accent`: the selected tab is filled with the accent colour (env switch). */
      tone: { accent: 'px-4 font-semibold', neutral: 'font-medium' },
      selected: {
        true: '',
        false: 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-white/5'
      }
    },
    compoundVariants: [
      { tone: 'accent', selected: true, className: 'bg-[var(--color-ds-accent)] text-black' },
      { tone: 'neutral', selected: true, className: 'text-[var(--color-ds-text)] bg-white/10' }
    ],
    defaultVariants: { tone: 'neutral', selected: false }
  }
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof tabVariants>

/** One button of a segmented group (env switch, navbar sections), with UI sounds. */
export default function TabButton({
  tone,
  selected = false,
  className,
  onClick,
  onMouseEnter,
  children,
  ...props
}: Props): React.JSX.Element {
  const sound = useUiSound(UiSoundProfile.Default)
  const merged = mergeSoundHandlers(sound, { onClick, onMouseEnter })

  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={merged.onClick}
      onMouseEnter={merged.onMouseEnter}
      className={cn(tabVariants({ tone, selected }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
