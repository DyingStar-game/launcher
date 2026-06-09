import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useLoreStore } from '@stores/lore'
import SidebarItemButton from '@components/ui/primitives/SidebarItemButton'

/** Sidebar list of lore articles from the lore store. */
export default function LoreSidebar(): React.JSX.Element {
  const { t } = useTranslation()
  const { articles, current, select } = useLoreStore()

  return (
    <div className="ds-sidebar">
      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          {t('lore.sidebarTitle')}
        </p>
        <p className="text-[11px] text-[var(--color-ds-muted)]">{t('lore.sidebarSubtitle')}</p>
      </div>

      {articles.map((a) => (
        <SidebarItemButton key={a.id} active={current?.id === a.id} onClick={() => select(a.id)}>
          {t(`lore.articles.${a.id}`, { defaultValue: a.id })}
        </SidebarItemButton>
      ))}
    </div>
  )
}
