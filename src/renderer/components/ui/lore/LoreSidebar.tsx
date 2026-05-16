import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useLoreStore } from '@stores/lore'

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
        <button
          key={a.id}
          onClick={() => select(a.id)}
          className={`text-left px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer ${
            current?.id === a.id
              ? 'bg-[var(--color-ds-surface)] text-[var(--color-ds-text)] border-[var(--color-ds-accent)]/40'
              : 'text-[var(--color-ds-muted)] border-transparent hover:border-[var(--color-ds-border)] hover:bg-[var(--color-ds-surface-hover)] hover:text-[var(--color-ds-text)]'
          }`}
        >
          {t(`lore.articles.${a.id}`, { defaultValue: a.id })}
        </button>
      ))}
    </div>
  )
}
