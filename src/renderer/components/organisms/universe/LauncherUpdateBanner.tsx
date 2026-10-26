import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useVersionStore } from '@stores/version'
import { useLauncherUpdateStore } from '@stores/launcherUpdate'
import { useGameStore } from '@stores/game'
import { useFilesStore } from '@stores/files'
import { launcherReleaseTagUrl } from '@lib/launcherRelease'
import { envString } from '@lib/env'
import LauncherUpdateBar from '@components/molecules/LauncherUpdateBar'

/**
 * The launcher update strip (ADR 0050): the in-place update's progress and restart button where
 * the launcher updates itself, else the release check's download link; nothing when up to date.
 */
export default function LauncherUpdateBanner(): React.JSX.Element | null {
  const { t } = useTranslation()
  const { update, installing, failed, install, ackFailure } = useLauncherUpdateStore()
  const {
    launcherUpdateAvailable,
    latestLauncherVersion,
    latestLauncherDownloadUrl,
    launcherPackageType
  } = useVersionStore()
  const gameRunning = useGameStore((s) => s.gameRunning)
  const gameInstalling = useFilesStore((s) => Object.values(s.data).some((d) => d.installing))

  useEffect(() => {
    if (!failed) return
    toast.error(t('universe.launcherUpdate.failed'))
    ackFailure()
  }, [failed, ackFailure, t])

  if (update.status === 'ready') {
    const blockedReason = gameRunning
      ? t('universe.launcherUpdate.waitGame')
      : gameInstalling
        ? t('universe.launcherUpdate.waitInstall')
        : null
    return (
      <LauncherUpdateBar
        version={update.version}
        onRestart={() => void install()}
        restartBlockedReason={blockedReason}
        restarting={installing}
        note={t('universe.launcherUpdate.installedOnQuit')}
      />
    )
  }
  if (update.status === 'downloading') {
    return <LauncherUpdateBar version={update.version} progress={update.percent} />
  }

  if (!launcherUpdateAvailable || !latestLauncherVersion) return null
  // deb and rpm cannot update themselves without root: their new package, downloaded directly
  if (latestLauncherDownloadUrl && launcherPackageType) {
    return (
      <LauncherUpdateBar
        version={latestLauncherVersion}
        downloadUrl={latestLauncherDownloadUrl}
        downloadLabel={t('universe.launcherUpdate.downloadPackage', { type: launcherPackageType })}
        note={t('universe.launcherUpdate.appImageUpdatesItself')}
      />
    )
  }
  const repoUrl = envString(import.meta.env.VITE_LAUNCHER_GITHUB_REPO_URL)
  // While the updater checks, the link would only flash before its progress
  const downloadUrl =
    repoUrl && update.status !== 'checking'
      ? launcherReleaseTagUrl(repoUrl, latestLauncherVersion)
      : undefined
  return <LauncherUpdateBar version={latestLauncherVersion} downloadUrl={downloadUrl} />
}
