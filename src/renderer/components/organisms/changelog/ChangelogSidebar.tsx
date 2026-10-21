import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheckIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import type { ChangelogEntryRef, ChangelogSidebarBlock } from '@shared/types/changelog'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import Button from '@components/atoms/Button'
import SidebarItemButton from '@components/atoms/SidebarItemButton'
import PageSidebar from '@components/atoms/PageSidebar'
import PendingCount from '@components/molecules/PendingCount'
import UnreadDot from '@components/molecules/UnreadDot'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible'
import { Skeleton } from '@components/ui/skeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import { formatDevBuildShort, groupDevReleases, isReleased } from '@lib/changelogEntries'

function blockComponent(block: ChangelogSidebarBlock): string {
  return block.kind === 'entry' ? block.entry.componentId : block.componentId
}

type DevGroupProps = {
  label: string
  unread: number
  defaultOpen: boolean
  children: React.ReactNode
}

/** The dev releases of a version, folded under a trigger showing how many are unread (ADR 0042). */
function DevGroup({ label, unread, defaultOpen, children }: DevGroupProps): React.JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(defaultOpen)
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <SidebarItemButton className="flex w-full items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <Chevron className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </span>
          <PendingCount count={unread} label={t('changelog.unreadCount', { count: unread })} />
        </SidebarItemButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col pl-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

/** Sidebar list of changelog versions grouped by component/module, dev releases folded. */
export default function ChangelogSidebar(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { activeEnv } = useEnvStore()
  const {
    data,
    loading,
    getEntries,
    getCurrentId,
    select,
    isUnread,
    unreadCount,
    markAllViewed,
    syncSelectionForEnv
  } = useChangelogStore()
  const waiting = loading && !data
  const showSkeleton = useDelayedFlag(waiting)

  const entries = getEntries(activeEnv)
  const currentId = getCurrentId(activeEnv)
  const blocks = groupDevReleases(entries)

  useEffect(() => {
    syncSelectionForEnv(activeEnv)
  }, [activeEnv, data, syncSelectionForEnv])

  const renderEntry = (entry: ChangelogEntryRef): React.JSX.Element => {
    // A build is named by its short date alone: its group already says what it is (ADR 0046)
    const build =
      entry.devOf !== null && entry.version
        ? formatDevBuildShort(entry.version, i18n.language)
        : null
    const label =
      entry.kind === 'unreleased'
        ? t('changelog.unreleased')
        : (build ?? t('changelog.versionLabel', { version: entry.version }))

    return (
      <SidebarItemButton
        key={entry.id}
        active={currentId === entry.id}
        onClick={() => select(entry.id)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="whitespace-nowrap tabular-nums">{label}</span>
          {entry.date && !build && (
            <span className="text-2xs text-ds-muted tabular-nums">{entry.date}</span>
          )}
        </span>
        {isUnread(entry.id) && currentId !== entry.id && <UnreadDot />}
      </SidebarItemButton>
    )
  }

  const devGroupLabel = (block: Extract<ChangelogSidebarBlock, { kind: 'dev' }>): string => {
    if (activeEnv === 'universe') {
      return t('changelog.devBuilds', { count: block.entries.length })
    }
    return data && isReleased(data, block.componentId, block.version)
      ? t('changelog.versionLabel', { version: block.version })
      : t('changelog.devGroupInProgress', { version: block.version })
  }

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
        {unreadCount(activeEnv) > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllViewed(activeEnv)}
            className="mt-2 w-full"
          >
            <CheckCheckIcon aria-hidden="true" />
            {t('changelog.markAllRead')}
          </Button>
        )}
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

      {blocks.map((block, index) => {
        const componentId = blockComponent(block)
        const showHeader = index === 0 || blockComponent(blocks[index - 1]) !== componentId
        const key = block.kind === 'entry' ? block.entry.id : `${componentId}:dev:${block.version}`
        // Open: the group holding the selection, and on Universe Testing the newest version
        const newestOfComponent =
          blocks.findIndex((b) => b.kind === 'dev' && b.componentId === componentId) === index

        return (
          <div key={key}>
            {showHeader && (
              <p className="px-3 pt-2 pb-1 text-2xs font-semibold uppercase tracking-widest text-ds-muted">
                {t(`changelog.components.${componentId}`, { defaultValue: componentId })}
              </p>
            )}
            {block.kind === 'entry' ? (
              renderEntry(block.entry)
            ) : (
              <DevGroup
                label={devGroupLabel(block)}
                unread={block.entries.filter((e) => isUnread(e.id)).length}
                defaultOpen={
                  block.entries.some((e) => e.id === currentId) ||
                  (activeEnv === 'universe-testing' && newestOfComponent)
                }
              >
                {block.entries.map(renderEntry)}
              </DevGroup>
            )}
          </div>
        )
      })}
    </PageSidebar>
  )
}
