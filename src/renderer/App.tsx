import Shell from '@components/layout/Shell'
import { useEffect } from 'react'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'
import { useChangelogStore } from '@stores/changelog'

/**
 * Runs one-time startup checks: API availability, version comparison, and changelog.
 */
function useAppStartup(): void {
  const { checkVersions, checked: versionChecked } = useVersionStore()
  const { checkAvailability, checked: availChecked } = useAvailabilityStore()
  const { fetch: fetchChangelog } = useChangelogStore()

  useEffect(() => {
    if (!availChecked) void checkAvailability()
    if (!versionChecked) void checkVersions()
  }, [availChecked, versionChecked, checkAvailability, checkVersions])

  useEffect(() => {
    void fetchChangelog()
  }, [fetchChangelog])
}

/** Root React tree: shell layout and startup side effects. */
function App(): React.JSX.Element {
  useAppStartup()
  return <Shell />
}

export default App
