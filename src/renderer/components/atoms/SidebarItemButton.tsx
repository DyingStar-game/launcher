import type React from 'react'
import { cva } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

const sidebarItemVariants = cva(
  'text-left px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
  {
    variants: {
      active: {
        true: 'bg-[var(--color-ds-surface)] text-[var(--color-ds-text)] border-[var(--color-ds-accent)]/40',
        false:
          'text-[var(--color-ds-muted)] border-transparent hover:border-[var(--color-ds-border)] ' +
          'hover:bg-[var(--color-ds-surface-hover)] hover:text-[var(--color-ds-text)]'
      }
    },
    defaultVariants: { active: false }
  }
)

/** Sidebar navigation item with default UI hover/click sounds. */
export default function SidebarItemButton({
  active = false,
  disabled,
  className,
  onClick,
  onMouseEnter,
  children,
  ...props
}: Props): React.JSX.Element {
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
