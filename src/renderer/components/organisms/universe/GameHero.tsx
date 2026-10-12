import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { useVersionStore } from '@stores/version'
import { useChangelogStore } from '@stores/changelog'
import { useNavigationStore } from '@stores/navigation'
import { GAME_COMPONENT_ID } from '@lib/changelogEntries'
import { formatReleaseDateDisplay } from '@lib/formatReleaseDate'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import UniverseHeading from '@components/molecules/UniverseHeading'
import GameUpdateCard from '@components/molecules/GameUpdateCard'

/**
 * The active universe on the home page: its name and installed version, and a pending game update
 * with a link to the game's latest changelog entry for the environment.
 */
export default function GameHero(): React.JSX.Element {
  const { t } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { installed, version, releaseDate } = useFilesStore((s) => s.data[activeEnv])
  const latestVersion = useVersionStore((s) => s.latestGameVersions[activeEnv].version)
  const entries = useChangelogStore((s) => s.getEntries)(activeEnv)
  const selectChangelog = useChangelogStore((s) => s.select)
  const navigate = useNavigationStore((s) => s.navigate)

  const updateAvailable = isGameUpdateAvailable(installed, version, latestVersion)
  // Newest first: a release in Universe, the unreleased notes in Universe Testing
  const gameEntry = entries.find((entry) => entry.componentId === GAME_COMPONENT_ID)

  const openChangelog = (): void => {
    if (gameEntry) selectChangelog(gameEntry.id)
    navigate('changelog')
  }

  // The update card goes above the name: the hero sits at the bottom, so the name does not move
  return (
    <>
      {updateAvailable && latestVersion && <GameUpdateCard onOpenChangelog={openChangelog} />}
      <UniverseHeading
        name={t(activeEnv === 'universe' ? 'navbar.envUniverse' : 'navbar.envTesting')}
        tagline={activeEnv === 'universe-testing' ? t('universe.hero.taglineTesting') : undefined}
        version={installed ? (version ?? undefined) : undefined}
        releaseDate={installed && releaseDate ? formatReleaseDateDisplay(releaseDate) : undefined}
      />
    </>
  )
}
