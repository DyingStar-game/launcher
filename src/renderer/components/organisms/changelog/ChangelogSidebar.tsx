import type React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import SidebarItemButton from '@components/atoms/SidebarItemButton'
import PageSidebar from '@components/atoms/PageSidebar'
import { Badge } from '@components/ui/badge'
import { Skeleton } from '@components/ui/skeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

/** Sidebar list of changelog versions grouped by component/module. */
export default function ChangelogSidebar(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, loading, getEntries, getCurrentId, select, isUnread, syncSelectionForEnv } =
    useChangelogStore()
  const waiting = loading && !data
  const showSkeleton = useDelayedFlag(waiting)

  const entries = getEntries(activeEnv)
  const currentId = getCurrentId(activeEnv)

  useEffect(() => {
    syncSelectionForEnv(activeEnv)
  }, [activeEnv, data, syncSelectionForEnv])

  return (
    <PageSidebar className="overflow-y-auto">
      <div className="px-2 pb-2 shrink-0">
        <p className="text-xs font-semibold text-ds-muted uppercase tracking-widest">
          {t('changelog.sidebarTitle')}
        </p>
        <p className="text-xs text-ds-muted">
          {activeEnv === 'universe-testing'
            ? t('changelog.sidebarSubtitleTesting')
            : t('changelog.sidebarSubtitle')}
        </p>
      </div>

      {/* Versions skeleton while the changelog loads (ADR 0018); "empty" only once it answered */}
      {showSkeleton && (
        <div
          role="status"
          aria-busy="true"
          aria-label={t('common.loadingContent')}
          className="flex flex-col gap-3 px-3 py-2"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} shape="line" className={index === 0 ? 'w-20' : 'w-32'} />
          ))}
        </div>
      )}
      {!waiting && entries.length === 0 && (
        <p className="px-3 py-2 text-xs text-ds-muted">{t('changelog.empty')}</p>
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
              <p className="px-3 pt-2 pb-1 text-2xs font-semibold uppercase tracking-widest text-ds-muted">
                {t(`changelog.components.${entry.componentId}`, {
                  defaultValue: entry.componentId
                })}
              </p>
            )}
            <SidebarItemButton
              active={currentId === entry.id}
              onClick={() => select(entry.id)}
              className="flex w-full items-center justify-between gap-2"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{label}</span>
                {entry.date && (
                  <span className="text-2xs text-ds-muted tabular-nums">{entry.date}</span>
                )}
              </span>
              {isUnread(entry.id) && currentId !== entry.id && <Badge>{t('changelog.new')}</Badge>}
            </SidebarItemButton>
          </div>
        )
      })}
    </PageSidebar>
  )
}
