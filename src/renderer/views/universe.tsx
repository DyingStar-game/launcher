import { useNavigationStore } from '@store/navigation'
import { useVersionStore } from '@store/version'
import AccountPanel from '@components/panel/accountPanel'
import GamePanel from '@components/panel/gamePanel'
import SocialPanel from '@components/panel/socialPanel'
import FilesPanel from '@components/panel/filesPanel'
import UpdateAlert from '@components/ui/updateAlert'

export default function Universe(): React.JSX.Element {
  useNavigationStore()
  const {
    launcherUpdateAvailable,
    currentLauncherVersion,
    latestLauncherVersion,
    latestLauncherReleaseDate
  } = useVersionStore()

  return (
    <div className="h-full flex flex-col gap-0">

      {/* Alerte launcher */}
      {launcherUpdateAvailable && latestLauncherVersion && (
        <div className="shrink-0 px-4 pt-3">
          <UpdateAlert
            variant="launcher"
            currentVersion={currentLauncherVersion}
            latestVersion={latestLauncherVersion}
            latestReleaseDate={latestLauncherReleaseDate ?? undefined}
          />
        </div>
      )}

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
        <AccountPanel />
        <SocialPanel />
        <GamePanel />
        <FilesPanel />
      </div>
    </div>
  )
}