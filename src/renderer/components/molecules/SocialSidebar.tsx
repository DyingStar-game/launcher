import { useTranslation } from 'react-i18next'
import SidebarItemButton from '@components/atoms/SidebarItemButton'
import { TabsList, TabsTrigger } from '@components/ui/tabs'

type Props = {
  /** Current tab, highlighted; switching goes through the enclosing `Tabs` (ADR 0016). */
  current: string
}

const TAB_KEYS = ['friends', 'players', 'requests', 'organizations'] as const

/** Tab list of the social page (friends / player search / requests / orgs), in a `Tabs`. */
export default function SocialSidebar({ current }: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="ds-sidebar">
      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          {t('universe.socialPage.sidebarTitle')}
        </p>
        <p className="text-[11px] text-[var(--color-ds-muted)]">
          {t('universe.socialPage.sidebarSubtitle')}
        </p>
      </div>

      <TabsList
        aria-label={t('universe.socialPage.sidebarTitle')}
        variant="plain"
        className="flex h-auto w-full flex-col items-stretch gap-1"
      >
        {TAB_KEYS.map((item) => (
          <TabsTrigger key={item} value={item} asChild>
            <SidebarItemButton active={current === item}>
              {t(`universe.socialPage.tabs.${item}.label`)}
            </SidebarItemButton>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}
