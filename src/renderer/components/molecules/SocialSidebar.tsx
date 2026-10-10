import { useTranslation } from 'react-i18next'
import SidebarItemButton from '@components/atoms/SidebarItemButton'
import { TabsList, TabsTrigger } from '@components/ui/tabs'
import PendingCount from './PendingCount'
import { SOCIAL_SECTIONS, type SocialSection } from '@lib/socialSections'

type Props = {
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
}: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="ds-sidebar">
      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          {t('universe.socialPage.sidebarTitle')}
        </p>
        <p className="text-xs text-[var(--color-ds-muted)]">
          {t('universe.socialPage.sidebarSubtitle')}
        </p>
      </div>

      <TabsList
        aria-label={t('universe.socialPage.sidebarTitle')}
        variant="plain"
        className="flex h-auto w-full flex-col items-stretch gap-1"
      >
        {SOCIAL_SECTIONS.map((section) => (
          <TabsTrigger key={section} value={section} asChild>
            <SidebarItemButton
              active={current === section}
              className="flex items-center justify-between gap-2"
            >
              {t(`universe.socialPage.sections.${section}.label`)}
              <PendingCount count={pending[section]} />
            </SidebarItemButton>
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-1 border-t border-[var(--color-ds-border)] pt-2">
        <SidebarItemButton disabled={!onOpenProfile} onClick={onOpenProfile} className="w-full">
          {t('universe.socialPage.myProfile')}
        </SidebarItemButton>
      </div>
    </div>
  )
}
