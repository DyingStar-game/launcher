import Navbar from './navbar'
import { useNavigationStore } from '@store/navigation'
import Universe from '@views/universe'
import UniverseTesting from '@views/universeTesting'
import Social from '@views/social'
import Lore from '@views/lore'

export default function Shell(): React.JSX.Element {
  const { currentView } = useNavigationStore()

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
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
    </div>
  )
}