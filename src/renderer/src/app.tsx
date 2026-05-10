import Shell from '@components/layout/shell'
import { useEffect } from 'react'
import { useVersionStore } from '@store/version'
import { useAvailabilityStore } from '@store/availability'

function useAppStartup(): void {
  const { checkVersions, checked: versionChecked } = useVersionStore()
  const { checkAvailability, checked: availChecked } = useAvailabilityStore()

  useEffect(() => {
    if (!availChecked) checkAvailability()
    if (!versionChecked) checkVersions()
  }, [])
}

function App(): React.JSX.Element {
  useAppStartup()
  return <Shell />
}

export default App