import type React from 'react'
import { useTranslation } from 'react-i18next'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogEntryItem from '@components/ui/changelog/ChangelogEntryItem'
import { resolveChangelogEntries } from '@lib/changelogEntries'

/** Renders the selected changelog version entries as left-aligned bullet list. */
export default function ChangelogContent(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, getEntries, getCurrentId, loading, fetched } = useChangelogStore()

  const entries = getEntries(activeEnv)
  const currentId = getCurrentId(activeEnv)
  const current = entries.find((e) => e.id === currentId)

  if (loading && !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <div className="ds-panel flex h-full flex-1 items-center justify-center text-[var(--color-ds-muted)]">
          {t('changelog.loading')}
        </div>
      </div>
    )
  }

  if (!fetched || !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <div className="ds-panel flex h-full flex-1 items-center justify-center text-[var(--color-ds-muted)]">
          {t('changelog.unavailable')}
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <div className="ds-panel flex h-full flex-1 items-center justify-center text-[var(--color-ds-muted)]">
          {t('changelog.selectVersion')}
        </div>
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

  const bullets = resolveChangelogEntries(data, current, i18n.language)

  return (
    <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
      <div className="ds-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full overflow-y-auto px-10 py-8 text-left">
          <header className="mb-6 text-left">
            <h1 className="text-xl font-bold text-[var(--color-ds-text)]">{title}</h1>
            {current.date && (
              <p className="mt-1 text-xs text-[var(--color-ds-muted)] tabular-nums">
                {current.date}
              </p>
            )}
          </header>

          {bullets.length === 0 ? (
            <p className="text-sm text-[var(--color-ds-muted)]">{t('changelog.noEntries')}</p>
          ) : (
            <ul className="changelog-list">
              {bullets.map((entry, index) => (
                <li key={`${current.id}-${index}`} className="changelog-list-item">
                  <ChangelogEntryItem text={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
