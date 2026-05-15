import Shell from '@components/layout/Shell'
import { useEffect } from 'react'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'

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