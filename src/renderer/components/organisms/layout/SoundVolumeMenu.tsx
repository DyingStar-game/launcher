import type React from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import SpeakerIcon from '@components/atoms/icons/SpeakerIcon'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'
import { Slider } from '@components/ui/slider'
import { UiSoundProfile } from '@shared/types/sounds'
import { useSoundStore } from '@stores/sound'

const CLOSE_DELAY_MS = 120

/**
 * Speaker button: a click (or Enter / Space) toggles mute; hovering opens the volume slider, and
 * so does the down arrow for keyboard users (Radix popover, ADR 0016).
 */
export default function SoundVolumeMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const openedByHoverRef = useRef(false)

  const enabled = useSoundStore((s) => s.enabled)
  const masterVolume = useSoundStore((s) => s.masterVolume)
  const setMasterVolume = useSoundStore((s) => s.setMasterVolume)
  const toggle = useSoundStore((s) => s.toggle)

  const volumePercent = Math.round(masterVolume * 100)

  const clearCloseTimer = (): void => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleMouseEnter = (): void => {
    clearCloseTimer()
    if (!open) {
      openedByHoverRef.current = true
      setOpen(true)
    }
  }

  const handleMouseLeave = (): void => {
    clearCloseTimer()
    // Only a hover-opened panel closes on leave; one opened from the keyboard stays open
    if (!openedByHoverRef.current) return
    closeTimerRef.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  // The click mutes: preventDefault stops Radix from toggling the panel
  const handleClick = (event: React.MouseEvent): void => {
    event.preventDefault()
    toggle()
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    clearCloseTimer()
    openedByHoverRef.current = false
    setOpen(true)
  }

  const handleOpenChange = (next: boolean): void => {
    clearCloseTimer()
    openedByHoverRef.current = false
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          soundProfile={UiSoundProfile.None}
          aria-label={t('navbar.toggleSound')}
          aria-pressed={!enabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SpeakerIcon muted={!enabled} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        aria-label={t('navbar.soundVolume')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // Hovering must not steal the focus; the down arrow moves it to the slider
        onOpenAutoFocus={(event) => openedByHoverRef.current && event.preventDefault()}
        className="min-w-[11rem]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-ds-muted shrink-0">
            {t('navbar.soundVolume')}
          </span>
          <span className="text-xs tabular-nums text-ds-muted">{volumePercent}%</span>
        </div>

        <Slider
          aria-label={t('navbar.soundVolume')}
          min={0}
          max={100}
          step={1}
          value={[volumePercent]}
          onValueChange={([value]) => setMasterVolume(value / 100)}
        />
      </PopoverContent>
    </Popover>
  )
}
