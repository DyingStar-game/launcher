import AppLayout from '@components/templates/AppLayout'
import ErrorBoundary from '@components/atoms/ErrorBoundary'
import RenderErrorNotice from '@components/molecules/RenderErrorNotice'
import Navbar from '@components/organisms/layout/Navbar'
import UniverseBar from '@components/organisms/layout/UniverseBar'
import UniversePage from '@pages/UniversePage'
import SocialPage from '@pages/SocialPage'
import ChangelogPage from '@pages/ChangelogPage'
import PlayerPage from '@pages/PlayerPage'
import OrganisationPage from '@pages/OrganisationPage'
import ProfileEditPage from '@pages/ProfileEditPage'
import OrganisationManagePage from '@pages/OrganisationManagePage'
import { useNavigationStore, type View } from '@stores/navigation'
import { useEffect } from 'react'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'
import { useChangelogStore } from '@stores/changelog'
import { useBackgroundMusic } from '@hooks/useBackgroundMusic'
import { useSocialAccountSync } from '@hooks/social/useSocialSnapshot'
import { useRefreshAfterGame } from '@hooks/useRefreshAfterGame'

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

  // Social data follows sign-in and sign-out in each environment (ADR 0025)
  useRefreshAfterGame()
  useSocialAccountSync('universe')
  useSocialAccountSync('universe-testing')
}

/** Page for a navigation view id. */
function renderPage(view: View): React.JSX.Element {
  switch (view) {
    case 'social':
      return <SocialPage />
    case 'changelog':
      return <ChangelogPage />
    case 'player':
      return <PlayerPage />
    case 'organisation':
      return <OrganisationPage />
    case 'profileEdit':
      return <ProfileEditPage />
    case 'organisationManage':
      return <OrganisationManagePage />
    default:
      return <UniversePage />
  }
}

type PageFrameProps = { view: View }

/** Current page; its boundary is keyed by the caller so each location mounts afresh. */
function PageFrame({ view }: PageFrameProps): React.JSX.Element {
  return renderPage(view)
}

/** Root React tree: startup side effects, then the current page in the app layout. */
function App(): React.JSX.Element {
  useAppStartup()
  useBackgroundMusic()
  const currentView = useNavigationStore((s) => s.currentView)
  // A new subject (another player or organisation) is a new page: no state carried over
  const subjectId = useNavigationStore((s) => s.subject?.id)

  return (
    // A zone that fails to render is replaced alone, the rest keeps working (ADR 0041)
    <AppLayout
      navbar={
        <ErrorBoundary fallback={() => null}>
          <Navbar />
        </ErrorBoundary>
      }
      universeBar={
        <ErrorBoundary fallback={() => null}>
          <UniverseBar />
        </ErrorBoundary>
      }
    >
      <ErrorBoundary
        key={`${currentView}:${subjectId ?? ''}`}
        fallback={(reset) => <RenderErrorNotice onRetry={reset} />}
      >
        <PageFrame view={currentView} />
      </ErrorBoundary>
    </AppLayout>
  )
}

export default App
