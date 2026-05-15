import Shell from '@components/layout/Shell'
import { useEffect } from 'react'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'

/**
 * Runs one-time startup checks: API availability and version comparison.
 */
function useAppStartup(): void {
  const { checkVersions, checked: versionChecked } = useVersionStore()
  const { checkAvailability, checked: availChecked } = useAvailabilityStore()

  useEffect(() => {
    if (!availChecked) void checkAvailability()
    if (!versionChecked) void checkVersions()
  }, [availChecked, versionChecked, checkAvailability, checkVersions])
}

/** Root React tree: shell layout and startup side effects. */
function App(): React.JSX.Element {
  useAppStartup()
  return <Shell />
}

export default App
