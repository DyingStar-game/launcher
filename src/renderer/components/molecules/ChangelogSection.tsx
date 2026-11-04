import type React from 'react'
import { useTranslation } from 'react-i18next'
import type { ChangelogFeedBuild, ChangelogGroup } from '@shared/types/changelog'
import ChangelogEntryList from '@components/molecules/ChangelogEntryList'
import FoldSection from '@components/molecules/FoldSection'
import { Badge } from '@components/ui/badge'

export type ChangelogSectionProps = {
  heading: string
  /** How many entries it holds. */
  count: number
  /** The date of a stable release, whose title does not hold it. */
  date?: string
  /** The main areas, shown once folded. */
  summary?: string
  yanked?: boolean
  groups: ChangelogGroup[]
  moduleTag?: (componentId: string) => string
  /** The builds of a day, with the name of their module (ADR 0051). */
  builds?: (ChangelogFeedBuild & { moduleLabel: string })[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** A day or a stable release of the changelog feed: its entries, then the builds it gathers. */
export default function ChangelogSection({
  heading,
  count,
  date,
  summary,
  yanked = false,
  groups,
  moduleTag,
  builds = [],
  open,
  onOpenChange
}: ChangelogSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const changes = t('changelog.changes', { count })
  const buildNames = builds.map(({ moduleLabel, version, yanked: withdrawn }) => {
    const build = `${moduleLabel} ${version}`
    return withdrawn ? t('changelog.buildYanked', { build }) : build
  })

  return (
    <FoldSection
      heading={heading}
      meta={date ? `${changes} · ${date}` : changes}
      summary={summary}
      aside={yanked ? <Badge variant="destructive">{t('changelog.yanked')}</Badge> : undefined}
      open={open}
      onOpenChange={onOpenChange}
    >
      <ChangelogEntryList groups={groups} moduleTag={moduleTag} />
      {buildNames.length > 0 && (
        <p className="border-t border-ds-border pt-2.5 text-2xs break-words text-ds-subtle">
          {t('changelog.builds', { count: buildNames.length, list: buildNames.join(' · ') })}
        </p>
      )}
    </FoldSection>
  )
}
