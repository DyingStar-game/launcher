import type React from 'react'
import { useId } from 'react'
import i18n from '@i18n'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import type { View } from '@stores/navigation'
import { useChangelogStore } from '@stores/changelog'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/primitives/Button'
import DiscordIcon from '@components/ui/primitives/icons/DiscordIcon'
import { navUrls } from '@lib/env'
import type { ReactNode } from 'react'

/** Wrapper for navbar icon buttons with hover border styling. */
function Icon({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center justify-center w-9 h-9 rounded-lg',
        'border border-[var(--color-ds-border)] bg-white/0',
        'hover:bg-[var(--color-ds-surface-hover)] hover:border-[var(--color-ds-border)]',
        'transition-colors',
        className
      ].join(' ')}
    >
      {children}
    </span>
  )
}

/** Accessible inline SVG with title for screen readers. */
function Svg({ children, title }: { children: ReactNode; title: string }): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
      <title>{title}</title>
      {children}
    </svg>
  )
}

function FlagFR(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4.5 h-4.5">
      <title>{t('navbar.languageFr')}</title>
      <rect x="3" y="6" width="6" height="12" rx="2" fill="#1b4db1" />
      <rect x="9" y="6" width="6" height="12" rx="0" fill="#ffffff" />
      <rect x="15" y="6" width="6" height="12" rx="2" fill="#d22f27" />
    </svg>
  )
}

function FlagEN(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4.5 h-4.5">
      <title>{t('navbar.languageEn')}</title>
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
  )
}

function HeartDonateIcon(): React.JSX.Element {
  const gradId = `navHeartFill-${useId().replace(/:/g, '')}`
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      overflow="visible"
      className="h-[18px] w-[18px] shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {/* Tracé centré dans 24×24 (≈ x∈[2,22]) pour éviter tout rognage au rendu */}
      <path
        fill={`url(#${gradId})`}
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  )
}

/** Top bar: env switcher, navigation, external links, language, and window controls. */
export default function Navbar(): React.JSX.Element {
  const { activeEnv, setEnv } = useEnvStore()
  const { currentView, navigate } = useNavigationStore()
  const hasUnreadChangelog = useChangelogStore((s) => s.hasUnread(activeEnv))
  const { t } = useTranslation()

  const { website: navWebsite, discord: navDiscord, wiki: navWiki, donate: navDonate } = navUrls()

  /** Switches active env in the store and navigates to the matching universe view. */
  const handleEnvSwitch = (env: 'universe' | 'universe-testing'): void => {
    setEnv(env)
    navigate(env)
  }

  const navLinks: { label: string; view: View; badge?: boolean }[] = [
    { label: t('navbar.social'), view: 'social' },
    { label: t('navbar.lore'), view: 'lore' },
    { label: t('navbar.changelog'), view: 'changelog', badge: hasUnreadChangelog }
  ]

  return (
    <nav className="app-drag ds-panel-bar flex items-center justify-between px-6 h-14 shrink-0">
      {/* Gauche : logo + onglets environnement */}
      <div className="app-no-drag flex items-center gap-6">
        <span className="font-bold text-[var(--color-ds-accent)] text-lg tracking-wider select-none">
          <svg
            width="160"
            height="50"
            viewBox="0 0 474 97"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[rgb(255,186,8)]"
          >
            <path
              d="M310.557 71.113C306.907 68.413 304.947 64.5531 304.677 59.5131H319.147C319.287 61.223 319.797 62.463 320.667 63.253C321.547 64.043 322.677 64.433 324.057 64.433C325.307 64.433 326.327 64.123 327.137 63.503C327.947 62.883 328.347 62.0131 328.347 60.903C328.347 59.473 327.677 58.363 326.337 57.583C324.997 56.803 322.827 55.923 319.827 54.953C316.647 53.893 314.067 52.863 312.107 51.873C310.147 50.883 308.437 49.423 306.987 47.513C305.537 45.603 304.807 43.093 304.807 40.003C304.807 36.863 305.587 34.173 307.157 31.943C308.727 29.703 310.897 28.013 313.667 26.853C316.437 25.703 319.577 25.123 323.077 25.123C328.757 25.123 333.287 26.453 336.677 29.103C340.067 31.753 341.877 35.483 342.107 40.283H327.357C327.307 38.803 326.857 37.703 326.007 36.963C325.157 36.223 324.057 35.853 322.717 35.853C321.697 35.853 320.867 36.153 320.227 36.753C319.577 37.353 319.257 38.203 319.257 39.313C319.257 40.233 319.617 41.033 320.327 41.703C321.037 42.373 321.927 42.953 322.987 43.433C324.047 43.913 325.617 44.533 327.697 45.263C330.787 46.323 333.337 47.373 335.347 48.413C337.357 49.453 339.087 50.903 340.537 52.773C341.987 54.643 342.717 57.003 342.717 59.873C342.717 62.783 341.987 65.3931 340.537 67.6931C339.087 70.0031 336.987 71.823 334.237 73.163C331.487 74.503 328.247 75.173 324.507 75.173C318.857 75.163 314.197 73.813 310.557 71.113Z"
              fill="currentColor"
            />
            <path
              d="M383.727 25.873V36.673H370.717V74.683H357.147V36.673H344.267V25.873H383.727Z"
              fill="currentColor"
            />
            <path
              d="M412.727 66.713H395.417L392.787 74.673H378.527L396.317 25.873H411.967L429.687 74.673H415.357L412.727 66.713ZM409.337 56.333L404.077 40.553L398.887 56.333H409.337Z"
              fill="currentColor"
            />
            <path
              d="M458.837 74.6831L449.147 56.6831H447.697V74.6831H434.127V25.8831H455.517C459.437 25.8831 462.767 26.5631 465.487 27.9231C468.207 29.2831 470.267 31.1531 471.647 33.5331C473.027 35.9131 473.727 38.5731 473.727 41.5331C473.727 44.8531 472.817 47.7731 470.997 50.2931C469.177 52.8131 466.507 54.5931 462.997 55.6531L474.007 74.6931H458.837V74.6831ZM447.687 47.4031H454.407C456.257 47.4031 457.637 46.9631 458.557 46.0831C459.477 45.2031 459.937 43.9331 459.937 42.2731C459.937 40.7031 459.467 39.4731 458.517 38.5731C457.567 37.6731 456.197 37.2231 454.397 37.2231H447.677V47.4031H447.687Z"
              fill="currentColor"
            />
            <path
              d="M146.777 32.043C151.277 36.383 153.527 42.423 153.527 50.173C153.527 57.923 151.277 63.943 146.777 68.233C142.277 72.523 135.867 74.673 127.557 74.673H113.767V25.533H127.557C135.867 25.533 142.267 27.703 146.777 32.043ZM144.497 66.233C148.367 62.383 150.307 57.023 150.307 50.163C150.307 43.253 148.367 37.863 144.497 33.993C140.627 30.123 134.977 28.183 127.557 28.183H116.917V72.003H127.557C134.977 72.013 140.627 70.083 144.497 66.233Z"
              fill="currentColor"
            />
            <path
              d="M189.857 25.533L174.387 54.793V74.673H171.237V54.793L155.627 25.533H159.197L172.777 51.853L186.287 25.533H189.857Z"
              fill="currentColor"
            />
            <path d="M197.067 25.533V74.673H193.917V25.533H197.067Z" fill="currentColor" />
            <path
              d="M240.257 74.673H237.107L208.267 30.713V74.673H205.117V25.603H208.267L237.107 69.423V25.603H240.257V74.673Z"
              fill="currentColor"
            />
            <path
              d="M288.697 40.0231C287.297 36.3331 284.977 33.3931 281.737 31.2031C278.497 29.0131 274.657 27.9131 270.217 27.9131C266.347 27.9131 262.847 28.8231 259.717 30.6431C256.587 32.4631 254.117 35.0531 252.297 38.4131C250.477 41.7731 249.567 45.6931 249.567 50.1731C249.567 54.6531 250.477 58.5731 252.297 61.9331C254.117 65.2931 256.587 67.8731 259.717 69.6731C262.847 71.4731 266.347 72.3731 270.217 72.3731C273.947 72.3731 277.337 71.5331 280.367 69.8531C283.397 68.1731 285.827 65.7831 287.647 62.6831C289.467 59.5831 290.467 55.9531 290.657 51.8031H268.747V49.1431H293.877V51.2431C293.737 55.8131 292.637 59.9231 290.587 63.5631C288.537 67.2031 285.737 70.0531 282.187 72.1031C278.637 74.1531 274.647 75.1831 270.217 75.1831C265.687 75.1831 261.607 74.1231 257.967 72.0031C254.327 69.8831 251.477 66.9131 249.427 63.1131C247.377 59.3131 246.347 55.0031 246.347 50.1931C246.347 45.3431 247.377 41.0131 249.427 37.2131C251.477 33.4131 254.327 30.4431 257.967 28.3231C261.607 26.2031 265.687 25.1331 270.217 25.1331C275.487 25.1331 280.047 26.4531 283.907 29.0931C287.757 31.7331 290.567 35.3831 292.337 40.0531H288.697V40.0231Z"
              fill="currentColor"
            />
            <path
              d="M40.3073 40.5031C37.6973 37.8931 27.3773 27.5731 24.7673 24.9631"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M57.6673 24.6331C63.0773 19.2231 67.3973 14.9031 72.8073 9.4931C55.0673 -2.1769 30.9873 -0.216897 15.3873 15.3831C-0.212696 30.9831 -2.1827 55.0731 9.4973 72.8131C14.3873 67.9231 19.5973 62.7131 24.4973 57.8131"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M87.3474 24.0332L24.0374 87.3432C41.7774 99.0132 65.8474 97.0432 81.4474 81.4432C97.0474 65.8432 99.0074 41.7732 87.3474 24.0332Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M93.8674 2.95312L60.5574 36.2731"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M36.1172 60.7231L4.14722 92.6831"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M48.4973 25.2732L48.5073 36.8932"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25.4072 48.353L36.7772 48.343"
              stroke="currentColor"
              strokeWidth="4"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M48.3572 51.503C49.9865 51.503 51.3072 50.1823 51.3072 48.553C51.3072 46.9238 49.9865 45.603 48.3572 45.603C46.728 45.603 45.4072 46.9238 45.4072 48.553C45.4072 50.1823 46.728 51.503 48.3572 51.503Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-[var(--color-ds-border)]">
          {(['universe', 'universe-testing'] as const).map((env) => (
            <button
              key={env}
              onClick={() => handleEnvSwitch(env)}
              className={[
                'px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                activeEnv === env
                  ? 'bg-[var(--color-ds-accent)] text-black'
                  : 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-white/5'
              ].join(' ')}
            >
              {env === 'universe' ? t('navbar.envUniverse') : t('navbar.envTesting')}
            </button>
          ))}
        </div>

        {/* Liens vues secondaires */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-[var(--color-ds-border)]">
          {navLinks.map(({ label, view, badge }) => (
            <button
              key={view}
              onClick={() => navigate(view)}
              className={[
                'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                currentView === view
                  ? 'text-[var(--color-ds-text)] bg-white/10'
                  : 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-white/5'
              ].join(' ')}
            >
              {label}
              {badge && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden="true">
                    <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 10-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Droite : langues + liens externes + soutenir */}
      <div className="app-no-drag flex items-center gap-3">
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-ds-border)]">
          <button
            onClick={() => void i18n.changeLanguage('en')}
            className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
            title={t('navbar.languageEn')}
            aria-label={t('navbar.switchToEnglish')}
          >
            <Icon>
              <FlagEN />
            </Icon>
          </button>
          <button
            onClick={() => void i18n.changeLanguage('fr')}
            className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
            title={t('navbar.languageFr')}
            aria-label={t('navbar.switchToFrench')}
          >
            <Icon>
              <FlagFR />
            </Icon>
          </button>
        </div>

        <button
          type="button"
          disabled={!navWebsite}
          onClick={() => navWebsite && window.open(navWebsite, '_blank')}
          className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--color-ds-muted)]"
          title={navWebsite ? t('navbar.openWebsite') : undefined}
          aria-label={t('navbar.openWebsite')}
        >
          <Icon className={!navWebsite ? 'opacity-60' : ''}>
            <Svg title={t('navbar.openWebsite')}>
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.5 9h-3.2a15.7 15.7 0 00-1.1-5 8.04 8.04 0 014.3 5zM12 4c1 1.5 1.8 3.8 2.1 7H9.9C10.2 7.8 11 5.5 12 4zM4.5 13h3.2c.2 1.9.7 3.7 1.1 5a8.04 8.04 0 01-4.3-5zm0-2a8.04 8.04 0 014.3-5c-.4 1.3-.9 3.1-1.1 5H4.5zm7.5 9c-1-1.5-1.8-3.8-2.1-7h4.2c-.3 3.2-1.1 5.5-2.1 7zm3.2-2c.4-1.3.9-3.1 1.1-5h3.2a8.04 8.04 0 01-4.3 5z" />
            </Svg>
          </Icon>
        </button>

        <button
          type="button"
          disabled={!navDiscord}
          onClick={() => navDiscord && window.open(navDiscord, '_blank')}
          className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--color-ds-muted)]"
          title={navDiscord ? t('navbar.brandDiscord') : undefined}
          aria-label={t('navbar.openDiscord')}
        >
          <Icon className={!navDiscord ? 'opacity-60' : ''}>
            <DiscordIcon className="w-4.5 h-4.5" title={t('navbar.brandDiscord')} />
          </Icon>
        </button>

        <button
          type="button"
          disabled={!navWiki}
          onClick={() => navWiki && window.open(navWiki, '_blank')}
          className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[var(--color-ds-muted)]"
          title={navWiki ? t('navbar.brandWiki') : undefined}
          aria-label={t('navbar.openWiki')}
        >
          <Icon className={!navWiki ? 'opacity-60' : ''}>
            <Svg title={t('navbar.brandWiki')}>
              <path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H6a3 3 0 01-3-3V6a2 2 0 012-2h1zm0 2H5v11a1 1 0 001 1h11V6H6zm2 2h7v2H8V8zm0 4h7v2H8v-2z" />
            </Svg>
          </Icon>
        </button>

        <Button
          disabled={!navDonate}
          onClick={() => navDonate && window.open(navDonate, '_blank')}
          variant="primary"
          size="sm"
          title={navDonate ? t('navbar.support') : t('navbar.donateUnavailable')}
          aria-label={navDonate ? t('navbar.support') : t('navbar.donateUnavailable')}
          className="ml-1 rounded-full px-4 shadow-none overflow-visible"
        >
          <span className="inline-flex items-center gap-2 overflow-visible">
            <HeartDonateIcon />
            {t('navbar.support')}
          </span>
        </Button>

        <div className="flex items-center gap-1 pl-2 border-l border-[var(--color-ds-border)]">
          <button
            type="button"
            onClick={() => {
              void window.api.minimizeWindow()
            }}
            className="text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
            title={t('navbar.minimize')}
            aria-label={t('navbar.minimize')}
          >
            <Icon>
              <Svg title={t('navbar.minimize')}>
                <path d="M5 19h14v-2H5v2z" />
              </Svg>
            </Icon>
          </button>
          <button
            type="button"
            onClick={() => {
              void window.api.closeWindow()
            }}
            className="text-[var(--color-ds-muted)] hover:text-red-300 transition-colors cursor-pointer"
            title={t('navbar.close')}
            aria-label={t('navbar.close')}
          >
            <Icon className="hover:border-red-500/40">
              <Svg title={t('navbar.close')}>
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </Svg>
            </Icon>
          </button>
        </div>
      </div>
    </nav>
  )
}
