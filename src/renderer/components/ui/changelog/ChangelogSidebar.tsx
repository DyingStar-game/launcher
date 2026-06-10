import type React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import SidebarItemButton from '@components/ui/primitives/SidebarItemButton'

function BellBadge(): React.JSX.Element {
  return (
    <span
      className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
        <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 10-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    </span>
  )
}

/** Sidebar list of changelog versions grouped by component/module. */
export default function ChangelogSidebar(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, getEntries, getCurrentId, select, isUnread, syncSelectionForEnv } =
    useChangelogStore()

  const entries = getEntries(activeEnv)
  const currentId = getCurrentId(activeEnv)

  useEffect(() => {
    syncSelectionForEnv(activeEnv)
  }, [activeEnv, data, syncSelectionForEnv])

  return (
    <div className="ds-sidebar overflow-y-auto">
      <div className="px-2 pb-2 shrink-0">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          {t('changelog.sidebarTitle')}
        </p>
        <p className="text-[11px] text-[var(--color-ds-muted)]">
          {activeEnv === 'universe-testing'
            ? t('changelog.sidebarSubtitleTesting')
            : t('changelog.sidebarSubtitle')}
        </p>
      </div>

      {entries.length === 0 && (
        <p className="px-3 py-2 text-xs text-[var(--color-ds-muted)]">{t('changelog.empty')}</p>
      )}

      {entries.map((entry, index) => {
        const showHeader = index === 0 || entries[index - 1].componentId !== entry.componentId
        const label =
          entry.kind === 'unreleased'
            ? t('changelog.unreleased')
            : t('changelog.versionLabel', { version: entry.version })

        return (
          <div key={entry.id}>
            {showHeader && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ds-muted)]">
                {t(`changelog.components.${entry.componentId}`, {
                  defaultValue: entry.componentId
                })}
              </p>
            )}
            <SidebarItemButton
              active={currentId === entry.id}
              onClick={() => select(entry.id)}
              className="relative w-full"
            >
              <span className="flex flex-col gap-0.5 pr-2">
                <span>{label}</span>
                {entry.date && (
                  <span className="text-[10px] text-[var(--color-ds-muted)] tabular-nums">
                    {entry.date}
                  </span>
                )}
              </span>
              {isUnread(entry.id) && currentId !== entry.id && <BellBadge />}
            </SidebarItemButton>
          </div>
        )
      })}
    </div>
  )
}
