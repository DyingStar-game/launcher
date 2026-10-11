import { useVersionStore } from '@stores/version'
import { useTranslation } from 'react-i18next'
import GamePanel from '@components/organisms/universe/GamePanel'
import SocialPanel from '@components/organisms/universe/SocialPanel'
import FilesPanel from '@components/organisms/universe/FilesPanel'
import UpdateAlert from '@components/molecules/UpdateAlert'
import UniverseLayout from '@components/templates/UniverseLayout'

type UniversePageProps = {
  showTestingBanner?: boolean
}

/** Universe home: game and files on the left, the social preview the whole height on the right. */
export default function UniversePage({
  showTestingBanner = false
}: UniversePageProps): React.JSX.Element {
  const { t } = useTranslation()
  const {
    launcherUpdateAvailable,
    currentLauncherVersion,
    latestLauncherVersion,
    latestLauncherReleaseDate
  } = useVersionStore()

  return (
    <UniverseLayout
      banner={
        showTestingBanner && (
          <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/30">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-[0.2em]">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
              </svg>
              {t('universeTesting.banner')}
            </span>
          </div>
        )
      }
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
