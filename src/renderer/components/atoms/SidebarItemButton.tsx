import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

const sidebarItemVariants = cva(
  'text-left px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer ' +
    'disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      active: {
        true: 'bg-ds-surface text-ds-text border-ds-accent/40',
        false:
          'text-ds-muted border-transparent not-disabled:hover:border-ds-border ' +
          'not-disabled:hover:bg-ds-surface-hover not-disabled:hover:text-ds-text'
      }
    },
    defaultVariants: { active: false }
  }
)

export type SidebarItemButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof sidebarItemVariants>

/** Sidebar navigation item with default UI hover/click sounds. */
export default function SidebarItemButton({
  active,
  disabled,
  className,
  onClick,
  onMouseEnter,
  children,
  ...props
}: SidebarItemButtonProps): React.JSX.Element {
  const sound = useUiSound(UiSoundProfile.Default, { disabled: Boolean(disabled) })
  const merged = mergeSoundHandlers(sound, { onClick, onMouseEnter })

  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={active ? 'true' : undefined}
      onClick={merged.onClick}
      onMouseEnter={merged.onMouseEnter}
      className={cn(sidebarItemVariants({ active }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
