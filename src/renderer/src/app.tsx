import Shell from '@components/layout/shell'
import { useEffect } from 'react'
import { useVersionStore } from '@store/version'

export function useVersionCheck(): void {
  const { checkVersions, checked } = useVersionStore()
 
  useEffect(() => {
    if (!checked) {
      checkVersions()
    }
  }, [])
}

function App(): React.JSX.Element {
  useVersionCheck()
  return <Shell />
}

export default App