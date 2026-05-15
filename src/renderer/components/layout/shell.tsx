import Navbar from './navbar'
import { useNavigationStore } from '@store/navigation'
import { useFitWindowToContent } from '@renderer/hooks/useFitWindowToContent'
import Universe from '@views/universe'
import UniverseTesting from '@views/universeTesting'
import Social from '@views/social'
import Lore from '@views/lore'

export default function Shell(): React.JSX.Element {
  const { currentView } = useNavigationStore()
  useFitWindowToContent()

  const renderView = (): React.JSX.Element => {
    switch (currentView) {
      case 'universe':         return <Universe />
      case 'universe-testing': return <UniverseTesting />
      case 'social':           return <Social />
      case 'lore':             return <Lore />
      default:                 return <Universe />
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
