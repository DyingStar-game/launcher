import type React from 'react'
import { useEffect, useId, useState } from 'react'
import i18n from '@i18n'
import { useTranslation } from 'react-i18next'
import { BookOpenIcon, CheckIcon } from 'lucide-react'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'
import LabelTooltip from '@components/molecules/LabelTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import { navUrls } from '@lib/env'
import { LANGUAGES, currentLanguage } from '@lib/languages'
import type { TopView, View } from '@stores/navigation'
import type { Env } from '@shared/types/env'

/** A top-level section link folded into the menu on narrow windows. */
export type NavbarSection = { label: string; view: TopView; badge?: boolean }

/** An environment of the env switch, folded into the menu on very narrow windows. */
export type NavbarEnvOption = { env: Env; label: string }

type Props = {
  /** Section links (Social, Lore, Changelog), hidden from the bar below the breakpoint. */
  sections: NavbarSection[]
  /** Section currently shown, highlighted in the menu. */
  currentSection: View
  onNavigate: (view: TopView) => void
  /** Env switch entries, shown in the menu only below the narrow breakpoint. */
  envs: NavbarEnvOption[]
  activeEnv: Env
  onEnvSwitch: (env: Env) => void
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
 * Compact navbar overflow menu: env switch, sections, languages, external links, and donate.
 * Shown below the wide breakpoint in place of the section links and the donate button; the env
 * switch joins it below the narrow breakpoint.
 */
export default function NavbarMoreMenu({
  sections,
  currentSection,
  onNavigate,
  envs,
  activeEnv,
  onEnvSwitch
}: Props): React.JSX.Element {
  const { t, i18n: i18nInstance } = useTranslation()
  const [open, setOpen] = useState(false)
  const { website, discord, wiki, donate } = navUrls()
  const currentLang = currentLanguage(i18nInstance)
  const hasBadge = sections.some((section) => section.badge)

  // Radix handles outside clicks, Escape, focus and the keyboard; the menu only closes itself
  // when the window grows past the breakpoint where it is hidden.
  useEffect(() => {
    if (!open) return
    const media = window.matchMedia('(min-width: 1400px)')
    const onBreakpoint = (): void => {
      if (media.matches) setOpen(false)
    }
    media.addEventListener('change', onBreakpoint)
    return () => media.removeEventListener('change', onBreakpoint)
  }, [open])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <LabelTooltip label={t('navbar.more')}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative" aria-label={t('navbar.more')}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
            </svg>
            {hasBadge && (
              <span
                data-testid="navbar-more-badge"
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
      </LabelTooltip>

      <DropdownMenuContent align="end" aria-label={t('navbar.more')} className="min-w-[13.5rem]">
        {/* Env switch: in the bar from the narrow breakpoint up */}
        <DropdownMenuGroup className="flex flex-col gap-0.5 nav-env:hidden">
          {envs.map(({ env, label }) => (
            <DropdownMenuItem asChild key={env}>
              <MenuItemButton selected={activeEnv === env} onClick={() => onEnvSwitch(env)}>
                {' '}
                <span className="flex-1">{label}</span>
              </MenuItemButton>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </DropdownMenuGroup>

        {sections.map(({ label, view, badge }) => (
          <DropdownMenuItem asChild key={view}>
            <MenuItemButton selected={currentSection === view} onClick={() => onNavigate(view)}>
              {' '}
              <span className="flex-1">{label}</span>
              {badge && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
            </MenuItemButton>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {LANGUAGES.map(({ code, labelKey }) => (
          <DropdownMenuItem asChild key={code}>
            <MenuItemButton
              selected={currentLang === code}
              onClick={() => void i18n.changeLanguage(code)}
            >
              <span className="flex-1">{t(labelKey)}</span>
              {currentLang === code && (
                <span className="shrink-0 text-[var(--color-ds-accent)]">
                  <CheckIcon className="w-4 h-4" aria-hidden="true" />
                </span>
              )}
            </MenuItemButton>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild disabled={!website}>
          <MenuItemButton
            disabled={!website}
            onClick={() => website && window.open(website, '_blank')}
          >
            {' '}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.5 9h-3.2a15.7 15.7 0 00-1.1-5 8.04 8.04 0 014.3 5zM12 4c1 1.5 1.8 3.8 2.1 7H9.9C10.2 7.8 11 5.5 12 4zM4.5 13h3.2c.2 1.9.7 3.7 1.1 5a8.04 8.04 0 01-4.3-5zm0-2a8.04 8.04 0 014.3-5c-.4 1.3-.9 3.1-1.1 5H4.5zm7.5 9c-1-1.5-1.8-3.8-2.1-7h4.2c-.3 3.2-1.1 5.5-2.1 7zm3.2-2c.4-1.3.9-3.1 1.1-5h3.2a8.04 8.04 0 01-4.3 5z" />
            </svg>
            {t('navbar.openWebsite')}
          </MenuItemButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!discord}>
          <MenuItemButton
            disabled={!discord}
            onClick={() => discord && window.open(discord, '_blank')}
          >
            {' '}
            <DiscordIcon className="w-4 h-4 shrink-0" />
            {t('navbar.brandDiscord')}
          </MenuItemButton>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!wiki}>
          <MenuItemButton disabled={!wiki} onClick={() => wiki && window.open(wiki, '_blank')}>
            {' '}
            <BookOpenIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t('navbar.brandWiki')}
          </MenuItemButton>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild disabled={!donate}>
          <MenuItemButton
            disabled={!donate}
            onClick={() => donate && window.open(donate, '_blank')}
          >
            {' '}
            <HeartIcon />
            <span className="font-semibold text-[var(--color-ds-accent)]">
              {donate ? t('navbar.support') : t('navbar.donateUnavailable')}
            </span>
          </MenuItemButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
