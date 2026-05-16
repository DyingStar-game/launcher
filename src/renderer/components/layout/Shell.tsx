import Navbar from './Navbar'
import { useNavigationStore } from '@stores/navigation'
import { useFitWindowToContent } from '@hooks/useFitWindowToContent'
import UniverseView from '@views/UniverseView'
import Social from '@views/Social'
import Lore from '@views/Lore'

/** Application shell: navbar, routed main content, and window auto-resize. */
export default function Shell(): React.JSX.Element {
  const { currentView } = useNavigationStore()
  useFitWindowToContent()

  /** Maps navigation store view id to the corresponding page component. */
  const renderView = (): React.JSX.Element => {
    switch (currentView) {
      case 'universe':
        return <UniverseView />
      case 'universe-testing':
        return <UniverseView showTestingBanner />
      case 'social':
        return <Social />
      case 'lore':
        return <Lore />
      default:
        return <UniverseView />
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden font-sans">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col bg-[var(--color-ds-bg)]">{renderView()}</main>
    </div>
  )
}
