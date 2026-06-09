import { useCallback } from 'react'
import type { MouseEvent, MouseEventHandler } from 'react'
import { UiSoundProfile } from '@shared/types/sounds'
import type { UiSoundProfile as UiSoundProfileType } from '@shared/types/sounds'
import { playUiClick, playUiHover, startPlayGameHover, stopPlayGameHover } from '@lib/sounds/engine'

type SoundHandlerProps = {
  onMouseEnter?: MouseEventHandler<HTMLElement>
  onMouseLeave?: MouseEventHandler<HTMLElement>
  onClick?: MouseEventHandler<HTMLElement>
}

type Options = {
  disabled?: boolean
}

function isInteractionBlocked(event: MouseEvent<HTMLElement>, disabled: boolean): boolean {
  if (disabled) return true

  const target = event.currentTarget
  if (target instanceof HTMLButtonElement && target.disabled) return true
  if (target instanceof HTMLInputElement && target.disabled) return true
  if (target.getAttribute('aria-disabled') === 'true') return true

  const disabledAncestor = target.closest('button:disabled, [aria-disabled="true"]')
  return Boolean(disabledAncestor)
}

/**
 * Returns mouse handlers that play hover/click SFX for the given profile.
 * Play-game hover is sustained until pointer leave; missing files fail silently.
 */
export function useUiSound(
  profile: UiSoundProfileType = UiSoundProfile.Default,
  options: Options = {}
): SoundHandlerProps {
  const { disabled = false } = options

  const onMouseEnter = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (isInteractionBlocked(event, disabled) || profile === UiSoundProfile.None) return

      if (profile === UiSoundProfile.PlayGame) {
        startPlayGameHover()
        return
      }

      playUiHover(profile)
    },
    [disabled, profile]
  )

  const onMouseLeave = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (profile !== UiSoundProfile.PlayGame) return
      if (isInteractionBlocked(event, disabled)) return
      stopPlayGameHover()
    },
    [disabled, profile]
  )

  const onClick = useCallback<MouseEventHandler<HTMLElement>>(
    (event) => {
      if (isInteractionBlocked(event, disabled) || profile === UiSoundProfile.None) return
      playUiClick(profile)
    },
    [disabled, profile]
  )

  return { onMouseEnter, onMouseLeave, onClick }
}

/** Merges user event handlers with UI sound handlers (sound runs first). */
export function mergeSoundHandlers(
  sound: SoundHandlerProps,
  user: SoundHandlerProps
): SoundHandlerProps {
  return {
    onMouseEnter: (event) => {
      sound.onMouseEnter?.(event)
      user.onMouseEnter?.(event)
    },
    onMouseLeave: (event) => {
      sound.onMouseLeave?.(event)
      user.onMouseLeave?.(event)
    },
    onClick: (event) => {
      sound.onClick?.(event)
      user.onClick?.(event)
    }
  }
}
