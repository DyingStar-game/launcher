import { useVersionStore } from '@stores/version'
import GamePanel from '@components/organisms/universe/GamePanel'
import SocialPanel from '@components/organisms/universe/SocialPanel'
import FilesPanel from '@components/organisms/universe/FilesPanel'
import UpdateAlert from '@components/molecules/UpdateAlert'
import UniverseLayout from '@components/templates/UniverseLayout'

/** Universe home: game and files on the left, the social preview the whole height on the right. */
export default function UniversePage(): React.JSX.Element {
  const {
    launcherUpdateAvailable,
    currentLauncherVersion,
    latestLauncherVersion,
    latestLauncherReleaseDate
  } = useVersionStore()

  return (
    <UniverseLayout
      alert={
        launcherUpdateAvailable &&
        latestLauncherVersion && (
          <UpdateAlert
            variant="launcher"
            currentVersion={currentLauncherVersion}
            latestVersion={latestLauncherVersion}
            latestReleaseDate={latestLauncherReleaseDate ?? undefined}
          />
        )
      }
      panels={[<GamePanel key="game" />, <FilesPanel key="files" />]}
      side={<SocialPanel />}
    />
  )
}
