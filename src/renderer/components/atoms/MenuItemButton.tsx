import type React from 'react'
import { cva } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

const menuItemVariants = cva(
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-ds-text)] ' +
    'transition-colors cursor-pointer ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
  {
    variants: {
      selected: {
        true: 'bg-[var(--color-ds-accent)]/15',
        false: 'hover:bg-[var(--color-ds-surface-hover)]'
      }
    },
    defaultVariants: { selected: false }
  }
)

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role'> & {
  selected?: boolean
}

/** Entry of a dropdown menu (`role="menuitem"`), with UI sounds; `selected` marks the current one. */
export default function MenuItemButton({
  selected = false,
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
      role="menuitem"
      disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      onClick={merged.onClick}
      onMouseEnter={merged.onMouseEnter}
      className={cn(menuItemVariants({ selected }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
