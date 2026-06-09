import type React from 'react'
import ChangelogSidebar from '@components/ui/changelog/ChangelogSidebar'
import ChangelogContent from '@components/ui/changelog/ChangelogContent'

/** Changelog page: version sidebar and localized release notes. */
export default function ChangelogPage(): React.JSX.Element {
  return (
    <div className="ds-page">
      <ChangelogSidebar />
      <ChangelogContent />
    </div>
  )
}
