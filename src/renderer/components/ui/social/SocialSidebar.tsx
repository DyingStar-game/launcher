import { useTranslation } from 'react-i18next'
import SidebarItemButton from '@components/ui/primitives/SidebarItemButton'

type Props = {
  current: string
  setCurrent: (v: string) => void
}

const TAB_KEYS = ['friends', 'organizations', 'requests'] as const

/** Tab sidebar for the social page (friends / orgs / requests). */
export default function SocialSidebar({ current, setCurrent }: Props): React.JSX.Element {
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

      {TAB_KEYS.map((item) => (
        <SidebarItemButton key={item} active={current === item} onClick={() => setCurrent(item)}>
          {t(`universe.socialPage.tabs.${item}.label`)}
        </SidebarItemButton>
      ))}
    </div>
  )
}
