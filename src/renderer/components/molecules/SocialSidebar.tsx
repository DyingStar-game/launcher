import { useTranslation } from 'react-i18next'
import { Building2Icon, UserIcon, UsersIcon, type LucideIcon } from 'lucide-react'
import SidebarItemButton from '@components/atoms/SidebarItemButton'
import PageSidebar from '@components/atoms/PageSidebar'
import { TabsList, TabsTrigger } from '@components/ui/tabs'
import PendingCount from './PendingCount'
import { SOCIAL_SECTIONS, type SocialSection } from '@lib/socialSections'

/** Icon in front of each section, as in the account menu. */
const SECTION_ICONS: Record<SocialSection, LucideIcon> = {
  friends: UsersIcon,
  organisations: Building2Icon
}

export type SocialSidebarProps = {
  /** Current section, highlighted; switching goes through the enclosing `Tabs` (ADR 0016). */
  current: SocialSection
  /** Requests waiting for the player, per section (ADR 0023). */
  pending: Record<SocialSection, number>
  /** Opens the player's own sheet; the entry is disabled until it is known. */
  onOpenProfile?: () => void
}

/**
 * Section list of the social page (friends / organisations, ADR 0023), in a `Tabs`, then a link
 * to the player's own sheet — a page, not a section.
 */
export default function SocialSidebar({
  current,
  pending,
  onOpenProfile
}: SocialSidebarProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <PageSidebar>
      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-ds-muted uppercase tracking-widest">
          {t('universe.socialPage.sidebarTitle')}
        </p>
        <p className="text-xs text-ds-muted">{t('universe.socialPage.sidebarSubtitle')}</p>
      </div>

      <TabsList
        aria-label={t('universe.socialPage.sidebarTitle')}
        variant="plain"
        className="flex h-auto w-full flex-col items-stretch gap-1"
      >
        {SOCIAL_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section]
          return (
            <TabsTrigger key={section} value={section} asChild>
              <SidebarItemButton active={current === section} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{t(`universe.socialPage.sections.${section}.label`)}</span>
                <PendingCount count={pending[section]} />
              </SidebarItemButton>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <div className="mt-1 border-t border-ds-border pt-2">
        <SidebarItemButton
          disabled={!onOpenProfile}
          onClick={onOpenProfile}
          className="flex w-full items-center gap-2"
        >
          <UserIcon className="size-4 shrink-0" aria-hidden="true" />
          {t('universe.socialPage.myProfile')}
        </SidebarItemButton>
      </div>
    </PageSidebar>
  )
}
