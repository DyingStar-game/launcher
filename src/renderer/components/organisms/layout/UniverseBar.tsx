import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { navSection, useNavigationStore, type TopView } from '@stores/navigation'
import { useChangelogStore } from '@stores/changelog'
import { ChevronDownIcon } from 'lucide-react'
import MenuItemButton from '@components/atoms/MenuItemButton'
import TabButton from '@components/atoms/TabButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import PendingCount from '@components/molecules/PendingCount'
import AccountMenu from '@components/organisms/layout/AccountMenu'
import { cn } from '@lib/cn'
import { pendingCounts } from '@lib/socialSections'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'

type Section = { label: string; view: TopView; count?: number; countLabel?: string }

/**
 * Second row of the header, for the universe picked in the top bar (ADR 0034): its sections, the
 * testing notice, and the player's account. Tinted amber in the testing environment. Below the
 * wide breakpoint, like the top bar, the sections fold into one menu and the testing notice moves
 * to a strip under the row; the account always stays.
 */
export default function UniverseBar(): React.JSX.Element {
  const { t } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { currentView, navigate } = useNavigationStore()
  const unreadChangelog = useChangelogStore((s) => s.unreadCount(activeEnv))
  // Friend requests and organisation requests the player can answer, as in the social sidebar
  const pending = pendingCounts(useSocialSnapshot().data)
  const pendingSocial = pending.friends + pending.organisations
  const testing = activeEnv === 'universe-testing'
  const current = navSection(currentView)

  const sections: Section[] = [
    { label: t('navbar.home'), view: activeEnv },
    {
      label: t('navbar.social'),
      view: 'social',
      count: pendingSocial,
      countLabel: t('navbar.socialPending', { count: pendingSocial })
    },
    {
      label: t('navbar.changelog'),
      view: 'changelog',
      count: unreadChangelog,
      countLabel: t('changelog.unreadCount', { count: unreadChangelog })
    }
  ]

  const currentSection = sections.find(({ view }) => view === current)
  const unread = sections.reduce((sum, { count = 0 }) => sum + count, 0)

  return (
    <div className="shrink-0">
      <nav
        aria-label={t('navbar.universeNav')}
        className={cn(
          'flex h-16 items-center justify-between gap-6 border-b px-6',
          testing ? 'border-amber-500/30 bg-amber-500/10' : 'border-ds-border bg-ds-surface'
        )}
      >
        {/* Sections: side by side from the wide breakpoint, in one menu below it */}
        <div className="hidden shrink-0 gap-1 nav-full:flex">
          {sections.map(({ label, view, count = 0, countLabel }) => (
            <TabButton key={view} selected={current === view} onClick={() => navigate(view)}>
              {label}
              <PendingCount count={count} label={countLabel} />
            </TabButton>
          ))}
        </div>

        <div className="nav-full:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Drawn as the current tab of the wide layout, so it stands out on either tint */}
              <TabButton
                selected
                aria-label={t('navbar.universeSections', { section: currentSection?.label })}
              >
                {currentSection?.label ?? t('navbar.universeNav')}
                <PendingCount count={unread} />
                <span className="inline-flex">
                  <ChevronDownIcon className="size-4" aria-hidden="true" />
                </span>
              </TabButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              aria-label={t('navbar.universeNav')}
              className="min-w-48"
            >
              {sections.map(({ label, view, count = 0, countLabel }) => (
                <DropdownMenuItem asChild key={view}>
                  <MenuItemButton selected={current === view} onClick={() => navigate(view)}>
                    <span className="flex-1">{label}</span>
                    <PendingCount count={count} label={countLabel} />
                  </MenuItemButton>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {testing && (
          <div className="hidden min-w-0 flex-1 justify-center nav-full:flex">
            <TestingNotice />
          </div>
        )}

        <div className="shrink-0">
          <AccountMenu />
        </div>
      </nav>

      {/* Below the wide breakpoint the testing notice gets its own strip, under the bar */}
      {testing && (
        <div className="flex justify-center border-b border-amber-500/30 bg-amber-500/10 px-6 py-1.5 nav-full:hidden">
          <TestingNotice />
        </div>
      )}
    </div>
  )
}

/** "Testing environment — data is not from the live server", in amber. */
function TestingNotice(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <p className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-amber-400 uppercase">
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
      </svg>
      <span className="whitespace-nowrap">{t('universeTesting.banner')}</span>
      <span className="truncate">{t('universeTesting.bannerDetail')}</span>
    </p>
  )
}
