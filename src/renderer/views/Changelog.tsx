import type React from 'react'
import { useLayoutEffect } from 'react'
import ChangelogSidebar from '@components/ui/changelog/ChangelogSidebar'
import ChangelogContent from '@components/ui/changelog/ChangelogContent'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'

/** Changelog page: version sidebar and localized release notes. */
export default function ChangelogPage(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const data = useChangelogStore((s) => s.data)
  const getCurrentId = useChangelogStore((s) => s.getCurrentId)
  const markViewed = useChangelogStore((s) => s.markViewed)
  const syncSelectionForEnv = useChangelogStore((s) => s.syncSelectionForEnv)

  useLayoutEffect(() => {
    syncSelectionForEnv(activeEnv)
    const currentId = getCurrentId(activeEnv)
    if (currentId) {
      markViewed(currentId, activeEnv)
    }
  }, [activeEnv, data, getCurrentId, markViewed, syncSelectionForEnv])

  return (
    <div className="ds-page">
      <ChangelogSidebar />
      <ChangelogContent />
    </div>
  )
}
