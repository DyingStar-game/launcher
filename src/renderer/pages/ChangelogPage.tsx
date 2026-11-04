import { useLayoutEffect } from 'react'
import ChangelogFeed from '@components/organisms/changelog/ChangelogFeed'
import ColumnPageLayout from '@components/templates/ColumnPageLayout'
import { useChangelog } from '@hooks/changelog/useChangelog'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'

/** Changelog page: the feed of the active universe; opening it marks what it holds as seen. */
export default function ChangelogPage(): React.JSX.Element {
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { data } = useChangelog()
  const openFeed = useChangelogStore((s) => s.openFeed)

  useLayoutEffect(() => {
    if (data) openFeed(activeEnv, data)
  }, [activeEnv, data, openFeed])

  return (
    <ColumnPageLayout>
      <ChangelogFeed />
    </ColumnPageLayout>
  )
}
