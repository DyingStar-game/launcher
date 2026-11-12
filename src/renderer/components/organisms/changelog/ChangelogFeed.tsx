import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheckIcon } from 'lucide-react'
import type {
  ChangelogFeed as Feed,
  ChangelogFeedSection,
  ChangelogNewMark,
  GlobalChangelog
} from '@shared/types/changelog'
import type { Env } from '@shared/types/env'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import LabeledDivider from '@components/atoms/LabeledDivider'
import Button from '@components/atoms/Button'
import TabButton from '@components/atoms/TabButton'
import ChangelogEntryList from '@components/molecules/ChangelogEntryList'
import ChangelogSection from '@components/molecules/ChangelogSection'
import FoldSection from '@components/molecules/FoldSection'
import LabelTooltip from '@components/molecules/LabelTooltip'
import PendingCount from '@components/molecules/PendingCount'
import StatusBadge from '@components/molecules/StatusBadge'
import TextSkeleton from '@components/molecules/TextSkeleton'
import { Skeleton } from '@components/ui/skeleton'
import { useChangelog, useChangelogUnreadMark } from '@hooks/changelog/useChangelog'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import {
  buildChangelogFeed,
  changelogFeedModules,
  countNewItems,
  filterChangelogFeed,
  formatFeedDate,
  formatFeedDay,
  groupChangelogItems,
  NOTHING_NEW,
  topAreas
} from '@lib/changelogEntries'

/** Sections open by default among those holding something new (ADR 0051). */
const OPEN_NEW_SECTIONS = 3
/** Sections listed past the mark before "Show older" (ADR 0051). */
const OLDER_SECTIONS_SHOWN = 10

type FeedBodyProps = {
  data: GlobalChangelog
  feed: Feed
  env: Env
  /** Where the "new since the last visit" mark sits, for this launch. */
  shown: ChangelogNewMark
}

/** The filters, what comes next, then the sections around the "new" mark. */
function FeedBody({ data, feed, env, shown }: FeedBodyProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [showOlder, setShowOlder] = useState(false)

  const moduleLabel = (id: string): string => t(`changelog.components.${id}`, { defaultValue: id })
  const modules = changelogFeedModules(feed)
  const { upcoming, sections } = filterChangelogFeed(feed, moduleId)
  const fresh = sections.filter((section) => countNewItems([section], shown) > 0)
  const older = sections.filter((section) => countNewItems([section], shown) === 0)
  const shownOlder = showOlder ? older : older.slice(0, OLDER_SECTIONS_SHOWN)

  // Under "All" on Universe Testing, every entry says its module; a release's title holds it (ADR 0051)
  const moduleTag = env === 'universe-testing' && moduleId === null ? moduleLabel : undefined

  const isOpen = (id: string, byDefault: boolean): boolean => opened[id] ?? byDefault
  const setOpen = (id: string) => (open: boolean) => setOpened((s) => ({ ...s, [id]: open }))

  const unread = useChangelogUnreadMark(env)
  const markSeen = useChangelogStore((s) => s.markSeen)
  const markAllSeen = useChangelogStore((s) => s.markAllSeen)
  const allRead = countNewItems(feed.sections, unread) === 0

  const freshOpenByDefault = (index: number): boolean => index < OPEN_NEW_SECTIONS
  // With nothing new, the newest section is open: the page never opens all folded
  const olderOpenByDefault = (index: number): boolean => fresh.length === 0 && index === 0

  // What is open on screen is seen, whatever opened it (ADR 0051); the store ignores what it knows
  const onScreen = [
    ...fresh.filter((section, index) => isOpen(section.id, freshOpenByDefault(index))),
    ...shownOlder.filter((section, index) => isOpen(section.id, olderOpenByDefault(index)))
  ].flatMap((section) => section.items.map((item) => item.publishedAt))
  useEffect(() => {
    markSeen(env, onScreen, data)
  })

  const renderSection = (section: ChangelogFeedSection, byDefault: boolean): React.JSX.Element => {
    const { names, others } = topAreas(section.items)
    const summary = [names.join(', '), others > 0 ? `+${others}` : ''].filter(Boolean).join(' ')
    const common = {
      count: section.items.length,
      summary,
      groups: groupChangelogItems(data, section.items, i18n.language),
      moduleTag,
      open: isOpen(section.id, byDefault),
      onOpenChange: setOpen(section.id)
    }

    return section.kind === 'day' ? (
      <ChangelogSection
        key={section.id}
        {...common}
        heading={formatFeedDay(section.publishedAt, i18n.language)}
        builds={section.builds.map((build) => ({
          ...build,
          moduleLabel: moduleLabel(build.componentId)
        }))}
      />
    ) : (
      <ChangelogSection
        key={section.id}
        {...common}
        heading={t('changelog.releaseTitle', {
          component: moduleLabel(section.componentId),
          version: section.version
        })}
        date={formatFeedDate(section.publishedAt, i18n.language)}
        yanked={section.yanked}
      />
    )
  }

  if (sections.length === 0 && upcoming.length === 0) {
    return <p className="text-sm text-ds-muted">{t('changelog.empty')}</p>
  }

  const newChanges = countNewItems(fresh, shown)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {modules.length > 1 && (
          <div
            role="group"
            aria-label={t('changelog.filterLabel')}
            className="flex flex-wrap gap-2"
          >
            {[null, ...modules].map((id) => {
              const count = countNewItems(filterChangelogFeed(feed, id).sections, unread)
              return (
                <TabButton
                  key={id ?? 'all'}
                  selected={moduleId === id}
                  aria-pressed={moduleId === id}
                  onClick={() => setModuleId(id)}
                >
                  {id === null ? t('changelog.filterAll') : moduleLabel(id)}
                  <PendingCount count={count} label={t('changelog.unreadCount', { count })} />
                </TabButton>
              )
            })}
          </div>
        )}
        {/* Always there, disabled once everything is read: the row does not move on click */}
        <div className="ml-auto flex">
          <LabelTooltip label={allRead ? t('changelog.allRead') : null} disabled>
            <Button variant="outline" disabled={allRead} onClick={() => markAllSeen(env, data)}>
              <CheckCheckIcon aria-hidden="true" />
              {t('changelog.markAllRead')}
            </Button>
          </LabelTooltip>
        </div>
      </div>

      {upcoming.length > 0 && (
        <FoldSection
          tone="apart"
          heading={t('changelog.upcoming')}
          meta={t('changelog.changes', { count: upcoming.length })}
          aside={<StatusBadge icon="pending">{t('changelog.upcomingBadge')}</StatusBadge>}
          open={isOpen('upcoming', false)}
          onOpenChange={setOpen('upcoming')}
        >
          <ChangelogEntryList
            groups={groupChangelogItems(data, upcoming, i18n.language)}
            moduleTag={moduleTag}
          />
        </FoldSection>
      )}

      {fresh.length > 0 && (
        <>
          <LabeledDivider tone="accent" className="mt-2">
            {t('changelog.newSince', {
              changes: t('changelog.changes', { count: newChanges })
            })}
          </LabeledDivider>
          {fresh.map((section, index) => renderSection(section, freshOpenByDefault(index)))}
          {older.length > 0 && (
            <LabeledDivider className="mt-2">{t('changelog.seenBefore')}</LabeledDivider>
          )}
        </>
      )}

      {shownOlder.map((section, index) => renderSection(section, olderOpenByDefault(index)))}

      {older.length > shownOlder.length && (
        <Button variant="outline" onClick={() => setShowOlder(true)} className="mt-2 self-start">
          {t('changelog.showOlder', { count: older.length - shownOlder.length })}
        </Button>
      )}
    </>
  )
}

/** The changelog of the active universe as one feed: a day or a release per section (ADR 0051). */
export default function ChangelogFeed(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { data, loading } = useChangelog()
  // Until the page marks the visit, nothing is new
  const shown = useChangelogStore((s) => s.shownMarkByEnv[activeEnv]) ?? NOTHING_NEW
  const showSkeleton = useDelayedFlag(loading)
  const feed = useMemo(
    () => (data ? buildChangelogFeed(data, activeEnv, i18n.language) : null),
    [data, activeEnv, i18n.language]
  )

  // Skeleton of the list while the changelog loads, after a short delay (ADR 0018)
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={t('common.loadingContent')}
        className="flex flex-col gap-6"
      >
        {showSkeleton && (
          <>
            <Skeleton shape="line" className="h-6 w-56" />
            <TextSkeleton lines={4} />
            <TextSkeleton lines={3} />
          </>
        )}
      </div>
    )
  }
  if (!data || !feed) return <p className="text-sm text-ds-muted">{t('changelog.unavailable')}</p>

  // Keyed by universe: filters and folds start over when it changes
  return <FeedBody key={activeEnv} data={data} feed={feed} env={activeEnv} shown={shown} />
}
