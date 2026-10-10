import type React from 'react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SpeakerIcon from '@components/ui/primitives/icons/SpeakerIcon'
import { useSoundStore } from '@stores/sound'

const CLOSE_DELAY_MS = 120

/** Speaker button: click toggles mute, hover opens volume slider dropdown. */
export default function SoundVolumeMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const sliderId = useId()

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
    setOpen(true)
  }

  const handleMouseLeave = (): void => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  const handleToggleMute = (): void => {
    toggle()
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={handleToggleMute}
        className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
        title={enabled ? t('navbar.soundEnabled') : t('navbar.soundDisabled')}
        aria-label={t('navbar.toggleSound')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span
          className={[
            'inline-flex items-center justify-center w-9 h-9 rounded-lg',
            'border border-[var(--color-ds-border)] bg-white/0',
            'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-border)]',
            'transition-colors',
            open ? 'border-[var(--color-ds-accent)]/40 bg-white/5' : ''
          ].join(' ')}
        >
          <SpeakerIcon
            muted={!enabled}
            title={enabled ? t('navbar.soundEnabled') : t('navbar.soundDisabled')}
          />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-1 z-[300]">
          <div
            role="region"
            aria-labelledby={`${sliderId}-label`}
            className={[
              'min-w-[11rem] rounded-xl border border-[var(--color-ds-border)]',
              'bg-[var(--color-ds-surface)] shadow-[var(--shadow-ds-modal)]',
              'px-3 py-3 flex flex-col gap-2.5'
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3">
              <label
                id={`${sliderId}-label`}
                htmlFor={sliderId}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ds-muted)] shrink-0"
              >
                {t('navbar.soundVolume')}
              </label>
              <span className="text-[11px] tabular-nums text-[var(--color-ds-muted)]">
                {volumePercent}%
              </span>
            </div>

            <input
              id={sliderId}
              type="range"
              min={0}
              max={100}
              step={1}
              value={volumePercent}
              onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
              className="sound-volume-slider w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
