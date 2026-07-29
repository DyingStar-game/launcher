import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import i18n from '@i18n'
import { useTranslation } from 'react-i18next'
import DiscordIcon from '@components/ui/primitives/icons/DiscordIcon'
import { mergeSoundHandlers, useUiSound } from '@hooks/useUiSound'
import { UiSoundProfile } from '@shared/types/sounds'
import { navUrls } from '@lib/env'
import type { ReactNode } from 'react'

function MenuItem({
  disabled,
  selected,
  onClick,
  children
}: {
  disabled?: boolean
  selected?: boolean
  onClick?: () => void
  children: ReactNode
}): React.JSX.Element {
  const uiSound = useUiSound(UiSoundProfile.Default, { disabled })
  const merged = mergeSoundHandlers(uiSound, {
    onClick: onClick
      ? (event) => {
          if (
            disabled ||
            (event.currentTarget instanceof HTMLButtonElement && event.currentTarget.disabled)
          ) {
            return
          }
          onClick()
        }
      : undefined
  })

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      onClick={merged.onClick}
      onMouseEnter={merged.onMouseEnter}
      className={[
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
        'transition-colors cursor-pointer',
        selected
          ? 'bg-[var(--color-ds-accent)]/15 text-[var(--color-ds-text)]'
          : 'text-[var(--color-ds-text)] hover:bg-[var(--color-ds-surface-hover)]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function HeartIcon(): React.JSX.Element {
  const gradId = `moreMenuHeart-${useId().replace(/:/g, '')}`
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-[var(--color-ds-accent)]"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  )
}

/**
 * Compact navbar overflow menu: languages, external links, and donate.
 * Shown below the wide breakpoint in place of the donate button.
 */
export default function NavbarMoreMenu(): React.JSX.Element {
  const { t, i18n: i18nInstance } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { website, discord, wiki, donate } = navUrls()
  const uiSound = useUiSound(UiSoundProfile.Default)
  const currentLang = (i18nInstance.resolvedLanguage ?? i18nInstance.language).startsWith('fr')
    ? 'fr'
    : 'en'

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    const media = window.matchMedia('(min-width: 1280px)')
    const onBreakpoint = (): void => {
      if (media.matches) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    media.addEventListener('change', onBreakpoint)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      media.removeEventListener('change', onBreakpoint)
    }
  }, [open])

  const runAndClose = (action: () => void): void => {
    action()
    setOpen(false)
  }

  const toggleHandlers = mergeSoundHandlers(uiSound, {
    onClick: () => setOpen((value) => !value)
  })

  return (
    <div ref={rootRef} className="relative ml-1">
      <button
        type="button"
        onClick={toggleHandlers.onClick}
        onMouseEnter={toggleHandlers.onMouseEnter}
        className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
        title={t('navbar.more')}
        aria-label={t('navbar.more')}
        aria-expanded={open}
        aria-haspopup="menu"
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
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <title>{t('navbar.more')}</title>
            <path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full pt-1 z-[300]">
          <div
            role="menu"
            aria-label={t('navbar.more')}
            className={[
              'min-w-[13.5rem] rounded-xl border border-[var(--color-ds-border)]',
              'bg-[var(--color-ds-surface)] shadow-[var(--shadow-ds-modal)]',
              'p-1.5 flex flex-col gap-0.5'
            ].join(' ')}
          >
            <MenuItem
              selected={currentLang === 'en'}
              onClick={() => runAndClose(() => void i18n.changeLanguage('en'))}
            >
              <span className="inline-flex w-4.5 h-4.5 items-center justify-center shrink-0">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4">
                  <rect x="3" y="6" width="18" height="12" rx="2" fill="#1b4db1" />
                  <path
                    d="M4 7.2l6.4 4.2L4 15.6v-1.8l4.2-2.4L4 9V7.2zm16 0V9l-4.2 2.4 4.2 2.4v1.8l-6.4-4.2L20 7.2z"
                    fill="#ffffff"
                    opacity="0.95"
                  />
                  <path d="M10.7 6h2.6v12h-2.6z" fill="#ffffff" />
                  <path d="M3 10.7h18v2.6H3z" fill="#ffffff" />
                  <path d="M11.25 6h1.5v12h-1.5z" fill="#d22f27" />
                  <path d="M3 11.25h18v1.5H3z" fill="#d22f27" />
                </svg>
              </span>
              <span className="flex-1">{t('navbar.languageEn')}</span>
              {currentLang === 'en' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0 fill-[var(--color-ds-accent)]"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </MenuItem>
            <MenuItem
              selected={currentLang === 'fr'}
              onClick={() => runAndClose(() => void i18n.changeLanguage('fr'))}
            >
              <span className="inline-flex w-4.5 h-4.5 items-center justify-center shrink-0">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4">
                  <rect x="3" y="6" width="6" height="12" rx="2" fill="#1b4db1" />
                  <rect x="9" y="6" width="6" height="12" rx="0" fill="#ffffff" />
                  <rect x="15" y="6" width="6" height="12" rx="2" fill="#d22f27" />
                </svg>
              </span>
              <span className="flex-1">{t('navbar.languageFr')}</span>
              {currentLang === 'fr' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0 fill-[var(--color-ds-accent)]"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </MenuItem>

            <div className="my-1 h-px bg-[var(--color-ds-border)]" role="separator" />

            <MenuItem
              disabled={!website}
              onClick={() => website && runAndClose(() => window.open(website, '_blank'))}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.5 9h-3.2a15.7 15.7 0 00-1.1-5 8.04 8.04 0 014.3 5zM12 4c1 1.5 1.8 3.8 2.1 7H9.9C10.2 7.8 11 5.5 12 4zM4.5 13h3.2c.2 1.9.7 3.7 1.1 5a8.04 8.04 0 01-4.3-5zm0-2a8.04 8.04 0 014.3-5c-.4 1.3-.9 3.1-1.1 5H4.5zm7.5 9c-1-1.5-1.8-3.8-2.1-7h4.2c-.3 3.2-1.1 5.5-2.1 7zm3.2-2c.4-1.3.9-3.1 1.1-5h3.2a8.04 8.04 0 01-4.3 5z" />
              </svg>
              {t('navbar.openWebsite')}
            </MenuItem>
            <MenuItem
              disabled={!discord}
              onClick={() => discord && runAndClose(() => window.open(discord, '_blank'))}
            >
              <DiscordIcon className="w-4 h-4 shrink-0" title={t('navbar.brandDiscord')} />
              {t('navbar.brandDiscord')}
            </MenuItem>
            <MenuItem
              disabled={!wiki}
              onClick={() => wiki && runAndClose(() => window.open(wiki, '_blank'))}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H6a3 3 0 01-3-3V6a2 2 0 012-2h1zm0 2H5v11a1 1 0 001 1h11V6H6zm2 2h7v2H8V8zm0 4h7v2H8v-2z" />
              </svg>
              {t('navbar.brandWiki')}
            </MenuItem>

            <div className="my-1 h-px bg-[var(--color-ds-border)]" role="separator" />

            <MenuItem
              disabled={!donate}
              onClick={() => donate && runAndClose(() => window.open(donate, '_blank'))}
            >
              <HeartIcon />
              <span className="font-semibold text-[var(--color-ds-accent)]">
                {donate ? t('navbar.support') : t('navbar.donateUnavailable')}
              </span>
            </MenuItem>
          </div>
        </div>
      )}
    </div>
  )
}
