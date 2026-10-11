import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

const tabVariants = cva(
  'relative inline-flex h-9 items-center gap-2 px-3 rounded-lg text-sm whitespace-nowrap ' +
    'transition-colors cursor-pointer',
  {
    variants: {
      /** `accent`: the selected tab is filled with the accent colour (env switch). */
      tone: { accent: 'px-4 font-semibold', neutral: 'font-medium' },
      selected: {
        true: '',
        false: 'text-ds-muted hover:text-ds-text hover:bg-white/5'
      }
    },
    compoundVariants: [
      { tone: 'accent', selected: true, className: 'bg-ds-accent text-black' },
      { tone: 'neutral', selected: true, className: 'text-ds-text bg-white/10' }
    ],
    defaultVariants: { tone: 'neutral', selected: false }
  }
)

export type TabButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof tabVariants>

/** One button of a segmented group (env switch, navbar sections), with UI sounds. */
export default function TabButton({
  tone,
  selected,
  className,
  onClick,
  onMouseEnter,
  children,
  ...props
}: TabButtonProps): React.JSX.Element {
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
