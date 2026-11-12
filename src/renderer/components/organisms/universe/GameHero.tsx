import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { useLatestGameVersion } from '@hooks/version/useLatestGameVersion'
import { useNavigationStore } from '@stores/navigation'
import { formatReleaseDateDisplay } from '@lib/formatReleaseDate'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import UniverseHeading from '@components/molecules/UniverseHeading'
import GameUpdateCard from '@components/molecules/GameUpdateCard'

/**
 * The active universe on the home page: its name and installed version, and a pending game update
 * with a link to the changelog.
 */
export default function GameHero(): React.JSX.Element {
  const { t } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { installed, version, releaseDate } = useFilesStore((s) => s.data[activeEnv])
  const latestVersion = useLatestGameVersion(activeEnv).version
  const navigate = useNavigationStore((s) => s.navigate)

  const updateAvailable = isGameUpdateAvailable(installed, version, latestVersion)

  // The update card goes above the name: the hero sits at the bottom, so the name does not move
  return (
    <>
      {updateAvailable && latestVersion && (
        <GameUpdateCard onOpenChangelog={() => navigate('changelog')} />
      )}
      <UniverseHeading
        name={t(activeEnv === 'universe' ? 'navbar.envUniverse' : 'navbar.envTesting')}
        tagline={activeEnv === 'universe-testing' ? t('universe.hero.taglineTesting') : undefined}
        version={installed ? (version ?? undefined) : undefined}
        releaseDate={installed && releaseDate ? formatReleaseDateDisplay(releaseDate) : undefined}
      />
    </>
  )
}
