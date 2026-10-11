import type React from 'react'
import { useEffect, useId, useState } from 'react'
import i18n from '@i18n'
import { useTranslation } from 'react-i18next'
import { CheckIcon } from 'lucide-react'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
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
import PendingCount from '@components/molecules/PendingCount'
import CommunityLinkItems from '@components/molecules/CommunityLinkItems'

/** A top-level section link folded into the menu on narrow windows. */
export type NavbarSection = {
  label: string
  view: TopView
  /** Unread or waiting items, shown as a `PendingCount`. */
  count?: number
  /** The count read as a sentence. */
  countLabel?: string
}

/** An environment of the env switch, folded into the menu on very narrow windows. */
export type NavbarEnvOption = { env: Env; label: string }

export type NavbarMoreMenuProps = {
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
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 text-ds-accent">
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
}: NavbarMoreMenuProps): React.JSX.Element {
  const { t, i18n: i18nInstance } = useTranslation()
  const [open, setOpen] = useState(false)
  const { website, discord, wiki, donate } = navUrls()
  const currentLang = currentLanguage(i18nInstance)
  const hasBadge = sections.some((section) => (section.count ?? 0) > 0)

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
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4.5 fill-current">
              <path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
            </svg>
            {hasBadge && (
              <span
                data-testid="navbar-more-badge"
                className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500 shadow-sm"
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

        {sections.map(({ label, view, count = 0, countLabel }) => (
          <DropdownMenuItem asChild key={view}>
            <MenuItemButton selected={currentSection === view} onClick={() => onNavigate(view)}>
              {' '}
              <span className="flex-1">{label}</span>
              <PendingCount count={count} label={countLabel} />
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
                <span className="shrink-0 text-ds-accent">
                  <CheckIcon className="size-4" aria-hidden="true" />
                </span>
              )}
            </MenuItemButton>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <CommunityLinkItems website={website} discord={discord} wiki={wiki} />

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild disabled={!donate}>
          <MenuItemButton
            disabled={!donate}
            onClick={() => donate && window.open(donate, '_blank')}
          >
            {' '}
            <HeartIcon />
            <span className="font-semibold text-ds-accent">
              {donate ? t('navbar.support') : t('navbar.donateUnavailable')}
            </span>
          </MenuItemButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
