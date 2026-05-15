import Navbar from './Navbar'
import { useNavigationStore } from '@stores/navigation'
import { useFitWindowToContent } from '@hooks/useFitWindowToContent'
import UniverseView from '@views/UniverseView'
import Social from '@views/Social'
import Lore from '@views/Lore'

export default function Shell(): React.JSX.Element {
  const { currentView } = useNavigationStore()
  useFitWindowToContent()

  const renderView = (): React.JSX.Element => {
    switch (currentView) {
      case 'universe':         return <UniverseView />
      case 'universe-testing': return <UniverseView showTestingBanner />
      case 'social':           return <Social />
      case 'lore':             return <Lore />
      default:                 return <UniverseView />
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col font-sans">
      <Navbar />
      <main className="flex-1 bg-[var(--color-ds-bg)]">
        {renderView()}
      </main>
    </div>
  )
}
