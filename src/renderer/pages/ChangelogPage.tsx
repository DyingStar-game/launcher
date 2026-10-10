import { useLayoutEffect } from 'react'
import ChangelogSidebar from '@components/organisms/changelog/ChangelogSidebar'
import ChangelogContent from '@components/organisms/changelog/ChangelogContent'
import SidebarPageLayout from '@components/templates/SidebarPageLayout'
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
    <SidebarPageLayout sidebar={<ChangelogSidebar />} bare>
      <ChangelogContent />
    </SidebarPageLayout>
  )
}
