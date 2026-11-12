import type React from 'react'
import { useTranslation } from 'react-i18next'
import type { ChangelogGroup } from '@shared/types/changelog'
import SectionLabel from '@components/atoms/SectionLabel'
import ChangelogEntryItem from '@components/molecules/ChangelogEntryItem'
import LabelTooltip from '@components/molecules/LabelTooltip'
import { Badge } from '@components/ui/badge'

export type ChangelogEntryListProps = {
  groups: ChangelogGroup[]
  /** Name of a module, shown as a tag after its entries; no tags without it. */
  moduleTag?: (componentId: string) => string
}

/**
 * Entries grouped by type (ADR 0040), each starting with its area, which gives its build in a
 * tooltip (ADR 0051). No heading when none of the entries has a type.
 */
export default function ChangelogEntryList({
  groups,
  moduleTag
}: ChangelogEntryListProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const showHeadings = groups.some((group) => group.label !== null)
  // French typography: a space before the colon
  const areaSeparator = i18n.language.startsWith('fr') ? ' : ' : ': '

  return (
    <>
      {groups.map((group) => (
        <section key={group.type ?? 'uncategorized'} className="flex flex-col gap-2">
          {showHeadings && (
            <SectionLabel as="h3">{group.label ?? t('changelog.uncategorized')}</SectionLabel>
          )}
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-left">
            {group.entries.map((entry, index) => {
              const tag = moduleTag?.(entry.componentId)
              return (
                <li key={index} className="text-sm leading-relaxed text-ds-body">
                  {entry.area && (
                    <>
                      <LabelTooltip label={entry.build} side="top">
                        <strong className="font-semibold text-ds-text">{entry.area}</strong>
                      </LabelTooltip>
                      {areaSeparator}
                    </>
                  )}
                  <ChangelogEntryItem text={entry.text} />
                  {tag && (
                    <Badge variant="subtle" className="ml-2">
                      {tag}
                    </Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
