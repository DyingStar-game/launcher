import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { cn } from '@lib/cn'

const menuItemVariants = cva(
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ds-text ' +
    'transition-colors cursor-pointer outline-none ' +
    // Radix marks the entry under the pointer or reached with the keyboard (ADR 0016)
    'data-[highlighted]:bg-ds-surface-hover ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
  {
    variants: {
      selected: {
        true: 'bg-ds-accent/15',
        false: 'hover:bg-ds-surface-hover'
      }
    },
    defaultVariants: { selected: false }
  }
)

export type MenuItemButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'role'> &
  VariantProps<typeof menuItemVariants>

/** Entry of a dropdown menu (`role="menuitem"`), with UI sounds; `selected` marks the current one. */
export default function MenuItemButton({
  selected,
  disabled,
  className,
  onClick,
  onMouseEnter,
  children,
  ...props
}: MenuItemButtonProps): React.JSX.Element {
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
