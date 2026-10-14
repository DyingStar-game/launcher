import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import Panel from '@components/atoms/Panel'
import SectionLabel from '@components/atoms/SectionLabel'
import { Badge } from '@components/ui/badge'
import ChangelogEntryItem from '@components/molecules/ChangelogEntryItem'
import { resolveChangelogGroups } from '@lib/changelogEntries'
import TextSkeleton from '@components/molecules/TextSkeleton'
import { Skeleton } from '@components/ui/skeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

/**
 * Renders the selected changelog version: a heading per type, then its entries as a left-aligned
 * bullet list, each starting with its area (ADR 0040).
 */
export default function ChangelogContent(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, getEntries, getCurrentId, loading, fetched } = useChangelogStore()

  const showSkeleton = useDelayedFlag(loading && !data)
  const entries = getEntries(activeEnv)
  const currentId = getCurrentId(activeEnv)
  const current = entries.find((e) => e.id === currentId)

  if (loading && !data) {
    // Skeleton of an entry while the changelog loads, after a short delay (ADR 0018)
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <Panel
          role="status"
          aria-busy="true"
          aria-label={t('common.loadingContent')}
          className="flex h-full flex-1 flex-col gap-6 p-6"
        >
          {showSkeleton && (
            <>
              <Skeleton shape="line" className="h-6 w-56" />
              <TextSkeleton lines={4} />
              <TextSkeleton lines={3} />
            </>
          )}
        </Panel>
      </div>
    )
  }

  if (!fetched || !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <Panel className="flex h-full flex-1 items-center justify-center">
          <p className="text-ds-muted">{t('changelog.unavailable')}</p>
        </Panel>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <Panel className="flex h-full flex-1 items-center justify-center">
          <p className="text-ds-muted">{t('changelog.selectVersion')}</p>
        </Panel>
      </div>
    )
  }

  const componentLabel = t(`changelog.components.${current.componentId}`, {
    defaultValue: current.componentId
  })
  const title =
    current.kind === 'unreleased'
      ? t('changelog.pageTitleUnreleased', { component: componentLabel })
      : t('changelog.pageTitleRelease', { component: componentLabel, version: current.version })

  const groups = resolveChangelogGroups(data, current, i18n.language)
  // Entries written before types: no heading when they are all there is
  const showHeadings = groups.some((group) => group.label !== null)
  // French typography: a space before the colon
  const areaSeparator = i18n.language.startsWith('fr') ? ' : ' : ': '

  return (
    <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full overflow-y-auto px-10 py-8 text-left">
          <header className="mb-6 text-left">
            <h1 className="text-xl font-bold text-ds-text">{title}</h1>
            {(current.date || current.yanked) && (
              <div className="mt-1 flex items-center gap-2">
                {current.date && (
                  <p className="text-xs text-ds-muted tabular-nums">{current.date}</p>
                )}
                {current.yanked && <Badge variant="destructive">{t('changelog.yanked')}</Badge>}
              </div>
            )}
          </header>

          {groups.length === 0 ? (
            <p className="text-sm text-ds-muted">{t('changelog.noEntries')}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section key={group.type ?? 'uncategorized'}>
                  {showHeadings && (
                    <SectionLabel as="h2">
                      {group.label ?? t('changelog.uncategorized')}
                    </SectionLabel>
                  )}
                  <ul className="m-0 list-disc pl-5 text-left">
                    {group.entries.map((entry, index) => (
                      <li
                        key={`${current.id}-${group.type}-${index}`}
                        className="my-3 text-left text-[0.9375rem] leading-[1.65] text-ds-text"
                      >
                        <ChangelogEntryItem
                          text={
                            entry.area
                              ? `**${entry.area}**${areaSeparator}${entry.text}`
                              : entry.text
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
