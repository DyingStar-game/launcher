import type React from 'react'
import { UiSoundProfile } from '@shared/types/sounds'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

const inactiveClass =
  'text-[var(--color-ds-muted)] border-transparent hover:border-[var(--color-ds-border)] hover:bg-[var(--color-ds-surface-hover)] hover:text-[var(--color-ds-text)]'

const activeClass =
  'bg-[var(--color-ds-surface)] text-[var(--color-ds-text)] border-[var(--color-ds-accent)]/40'

/** Sidebar navigation item with default UI hover/click sounds. */
export default function SidebarItemButton({
  active = false,
  disabled,
  className = '',
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
      onClick={merged.onClick}
      onMouseEnter={merged.onMouseEnter}
      className={[
        'text-left px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        active ? activeClass : inactiveClass,
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
