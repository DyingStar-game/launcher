import { useVersionStore } from '@stores/version'
import { useEnvStore } from '@stores/env'
import { launcherReleaseTagUrl } from '@lib/launcherRelease'
import { envString } from '@lib/env'
import GameHero from '@components/organisms/universe/GameHero'
import GameActionBar from '@components/organisms/universe/GameActionBar'
import SocialPanel from '@components/organisms/universe/SocialPanel'
import LauncherUpdateBar from '@components/molecules/LauncherUpdateBar'
import KeyArtSlideshow from '@components/molecules/KeyArtSlideshow'
import { KEY_ART, KEY_ART_INTERVAL_MS } from '@lib/keyArt'
import UniverseLayout from '@components/templates/UniverseLayout'

/**
 * Universe home: the universe over the full frame, the social preview on the right, and the
 * action bar at the bottom, under a strip when a new launcher is out.
 */
export default function UniversePage(): React.JSX.Element {
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { launcherUpdateAvailable, latestLauncherVersion } = useVersionStore()
  const repoUrl = envString(import.meta.env.VITE_LAUNCHER_GITHUB_REPO_URL)

  return (
    <UniverseLayout
      hero={<GameHero />}
      backdrop={<KeyArtSlideshow images={KEY_ART} intervalMs={KEY_ART_INTERVAL_MS} />}
      side={<SocialPanel />}
      banner={
        launcherUpdateAvailable &&
        latestLauncherVersion && (
          <LauncherUpdateBar
            version={latestLauncherVersion}
            downloadUrl={
              repoUrl ? launcherReleaseTagUrl(repoUrl, latestLauncherVersion) : undefined
            }
          />
        )
      }
      // A fresh bar per universe: the files panel opens again where the game is not installed
      actionBar={<GameActionBar key={activeEnv} />}
    />
  )
}
