import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { DownloadIcon, PauseIcon, PlayIcon, RefreshCwIcon, XIcon } from 'lucide-react'
import { useEnvStore } from '@stores/env'
import { useGameStore } from '@stores/game'
import { useFilesStore, type EnvFilesData, type InstallRunOutcome } from '@stores/files'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'
import { useAccountStore } from '@stores/account'
import { useServerStatus } from '@hooks/status/useServerStatus'
import { useAuthAvailability } from '@hooks/status/useAuthAvailability'
import { UiSoundProfile } from '@shared/types/sounds'
import { formatGameVersionDisplay } from '@shared/gameVersion'
import { canStopInstall, gameAction, type GameAction } from '@lib/gameAction'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import { formatBytes, formatInstallProgress } from '@lib/formatInstallProgress'
import { secondsLeft } from '@lib/transferRate'
import { formatReleaseDateDisplay } from '@lib/formatReleaseDate'
import { statusPageUrlForEnv } from '@lib/env'
import { statusRefetchMs } from '@lib/statusQueries'
import Button from '@components/atoms/Button'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'
import LabelTooltip from '@components/molecules/LabelTooltip'
import ServerStatusLink from '@components/molecules/ServerStatusLink'
import GameStateSummary from '@components/molecules/GameStateSummary'
import GameFilesPopover from '@components/organisms/universe/GameFilesPopover'

/** An update's builds and release, e.g. "10/10/2026 16:08 → 12/10/2026 16:08 · Released 12/10/2026". */
function updateDetail(
  t: TFunction,
  installed: string | null,
  latest: string | null,
  releaseDate: string | null
): string {
  if (!latest) return ''
  const builds = installed
    ? `${formatGameVersionDisplay(installed)} → ${formatGameVersionDisplay(latest)}`
    : formatGameVersionDisplay(latest)
  return releaseDate
    ? `${builds} · ${t('universe.gameUpdate.releasedOn', { date: formatReleaseDateDisplay(releaseDate) })}`
    : builds
}

/** Downloaded and total sizes, e.g. "6.1 GB / 14.2 GB". */
function byteCounts(t: TFunction, downloaded: number, total: number): string {
  return t('universe.action.bytes', {
    downloaded: formatBytes(downloaded),
    total: formatBytes(total)
  })
}

/**
 * Install progress details: while downloading, the sizes, speed and time left (the heading already
 * says it installs); otherwise the step.
 */
function installDetail(t: TFunction, files: EnvFilesData): string {
  const event = files.progressEvent
  if (event?.key !== 'downloading') return formatInstallProgress(t, event)
  const parts = [byteCounts(t, event.downloaded, event.total)]
  if (files.bytesPerSecond) {
    parts.push(t('universe.action.installing.rate', { rate: formatBytes(files.bytesPerSecond) }))
    const left = secondsLeft(event.downloaded, event.total, files.bytesPerSecond)
    if (left !== null) {
      parts.push(
        left < 60
          ? t('universe.action.installing.etaUnderMinute')
          : t('universe.action.installing.eta', { minutes: Math.ceil(left / 60) })
      )
    }
  }
  return parts.filter(Boolean).join(' · ')
}

/**
 * Bar fixed at the bottom of the home page: server status, where the game stands (with Cancel
 * while downloading, ADR 0037), the game files panel and the one main action (install, update,
 * pause, resume, sign in, play), or why there is none.
 */
export default function GameActionBar(): React.JSX.Element {
  const { t } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { play, gameRunning, isLaunching } = useGameStore()
  const {
    data: filesData,
    install,
    update,
    pause,
    resume,
    cancel,
    syncInstalledVersions
  } = useFilesStore()
  const latest = useVersionStore((s) => s.latestGameVersions[activeEnv])
  const refreshGameVersions = useVersionStore((s) => s.refreshGameVersions)
  const latestVersion = latest.version
  const available = useAvailabilityStore((s) => s.available[activeEnv])
  const { status, players } = useServerStatus(activeEnv)
  const authAvailable = useAuthAvailability(activeEnv)
  const account = useAccountStore((s) => s.data[activeEnv])
  const login = useAccountStore((s) => s.login)

  const files = filesData[activeEnv]

  // The files panel opens by itself while the game is not installed, until the player toggles it
  const [filesOpen, setFilesOpen] = useState<boolean | null>(null)
  const [pathError, setPathError] = useState(false)

  useEffect(() => {
    void syncInstalledVersions()
  }, [activeEnv, syncInstalledVersions])

  // The game version is polled like the status (`useServerStatus`): an update released during a
  // maintenance shows once it ends, without restarting the launcher (ADR 0039)
  useEffect(() => {
    if (!available) return
    const id = window.setInterval(() => void refreshGameVersions(), statusRefetchMs())
    return () => window.clearInterval(id)
  }, [available, refreshGameVersions])

  const action = gameAction({
    available,
    installed: files.installed,
    installing: files.installing,
    paused: files.paused !== null,
    updateAvailable: isGameUpdateAvailable(files.installed, files.version, latestVersion),
    serverStatus: status,
    authAvailable,
    accountStatus: account.status,
    sessionExpired: account.sessionExpired ?? false,
    launching: isLaunching,
    running: gameRunning
  })

  /** Tells the player an install or update stopped on an error (paused ones are on purpose). */
  const reportInstall = (outcome: InstallRunOutcome): void => {
    if (outcome === 'interrupted') toast.error(t('universe.action.installing.interrupted'))
    if (outcome === 'failed') toast.error(t('universe.action.installing.failed'))
  }

  const handlePlay = async (): Promise<void> => {
    if ((await play()) === 'updateRequired') toast.warning(t('universe.action.update.beforePlay'))
  }

  const handleInstall = (): void => {
    if (!files.installPath.trim()) {
      setPathError(true)
      setFilesOpen(true)
      return
    }
    setPathError(false)
    setFilesOpen(false)
    void install().then(reportInstall)
  }

  const ready = t('universe.action.ready.title')
  const summary: Record<GameAction, { title: string; detail: string }> = {
    unavailable: {
      title: t('universe.action.unavailable.title'),
      detail: t('universe.files.unavailable')
    },
    installing: {
      title: t(
        files.installed
          ? 'universe.action.installing.titleUpdate'
          : 'universe.action.installing.titleInstall',
        { progress: Math.round(files.progress) }
      ),
      detail: installDetail(t, files)
    },
    paused: {
      title: t('universe.action.paused.title', { progress: files.paused?.progress ?? 0 }),
      detail: files.paused
        ? files.paused.total > 0
          ? byteCounts(t, files.paused.downloaded, files.paused.total)
          : formatBytes(files.paused.downloaded)
        : ''
    },
    install: {
      title: t('universe.game.notInstalled'),
      detail: files.installPath.trim()
        ? t('universe.action.install.detailPath', { path: files.installPath })
        : t('universe.action.install.detailNoPath')
    },
    update: {
      title: t('universe.action.update.title'),
      detail: updateDetail(t, files.version, latestVersion, latest.releaseDate)
    },
    running: {
      title: t('universe.action.running.title'),
      detail: t('universe.game.playDisabledRunning')
    },
    launching: { title: ready, detail: t('universe.game.playDisabledLaunching') },
    serverDown: {
      title: ready,
      detail:
        status === 'maintenance'
          ? t('universe.game.playDisabledMaintenance')
          : t('universe.action.serverDown.detail')
    },
    authDown: {
      title: account.status === 'connected' ? ready : t('universe.action.signIn.title'),
      detail: t('universe.action.authDown.detail')
    },
    checkingSession: { title: ready, detail: t('universe.game.playDisabledAuthLoading') },
    signIn: {
      title: t('universe.action.signIn.title'),
      detail: account.sessionExpired
        ? t('universe.game.sessionExpired')
        : t('universe.game.playDisabledAuth')
    },
    play: { title: ready, detail: t('universe.action.ready.upToDate') }
  }

  const playButton = (
    <Button
      variant="primary"
      size="cta"
      className="w-70"
      soundProfile={UiSoundProfile.PlayGame}
      disabled={action !== 'play'}
      loading={action === 'launching'}
      onClick={() => void handlePlay()}
    >
      <PlayIcon aria-hidden="true" />
      {t('universe.game.play')}
    </Button>
  )

  /** A main action that cannot be taken, with what stops it. */
  const blocked = (label: string): React.JSX.Element => (
    <Button variant="secondary" size="cta" className="w-70" disabled>
      {label}
    </Button>
  )

  const cta: Record<GameAction, React.JSX.Element> = {
    unavailable: blocked(t('universe.action.unavailable.cta')),
    // Pause while downloading (ADR 0037); once extracting, nothing can stop it
    installing: canStopInstall(files.progressEvent) ? (
      <Button
        variant="primary"
        size="cta"
        className="w-70"
        loading={files.stopping === 'pause'}
        onClick={() => void pause()}
      >
        <PauseIcon aria-hidden="true" />
        {t('universe.action.installing.ctaPause')}
      </Button>
    ) : (
      blocked(
        t(
          files.installed
            ? 'universe.action.installing.ctaUpdate'
            : 'universe.action.installing.ctaInstall'
        )
      )
    ),
    paused: (
      <Button
        variant="primary"
        size="cta"
        className="w-70"
        onClick={() => void resume().then(reportInstall)}
      >
        <PlayIcon aria-hidden="true" />
        {t('universe.action.paused.cta')}
      </Button>
    ),
    install: (
      <Button variant="primary" size="cta" className="w-70" onClick={handleInstall}>
        <DownloadIcon aria-hidden="true" />
        {t('universe.action.install.cta')}
      </Button>
    ),
    update: (
      <Button
        variant="primary"
        size="cta"
        className="w-70"
        onClick={() => void update().then(reportInstall)}
      >
        <RefreshCwIcon aria-hidden="true" />
        {t('universe.action.update.cta')}
      </Button>
    ),
    running: blocked(t('universe.action.running.cta')),
    launching: playButton,
    serverDown: blocked(t('universe.action.serverDown.cta')),
    authDown: blocked(t('universe.action.authDown.cta')),
    checkingSession: playButton,
    signIn: (
      <Button
        variant="discord"
        size="cta"
        className="w-70"
        aria-label={t('navbar.account.signIn')}
        onClick={() => void login()}
      >
        <DiscordIcon className="size-6" />
        {t('navbar.account.signInShort')}
      </Button>
    ),
    play: playButton
  }

  // Destructive: what was downloaded is lost
  const cancelButton = (
    <LabelTooltip label={t('universe.action.cancel')} side="top">
      <Button
        variant="danger"
        size="icon"
        aria-label={t('universe.action.cancel')}
        loading={files.stopping === 'cancel'}
        onClick={() => void cancel()}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </LabelTooltip>
  )
  // Cancel above the end of the progress, while the download can still be stopped or is paused
  const downloadActions =
    (action === 'installing' && canStopInstall(files.progressEvent)) || action === 'paused'
      ? cancelButton
      : null

  return (
    <div className="flex h-26 shrink-0 items-center gap-7 border-t border-ds-border bg-ds-bg px-7">
      <ServerStatusLink
        status={available ? status : 'unavailable'}
        players={players}
        href={statusPageUrlForEnv(activeEnv) || undefined}
      />
      <div aria-hidden="true" className="h-12 w-px shrink-0 bg-ds-border" />
      <GameStateSummary
        heading={summary[action].title}
        detail={summary[action].detail}
        progress={
          action === 'installing'
            ? files.progress
            : action === 'paused'
              ? files.paused?.progress
              : undefined
        }
        actions={downloadActions}
      />
      <GameFilesPopover
        open={filesOpen ?? action === 'install'}
        onOpenChange={setFilesOpen}
        pathError={pathError}
      />
      {cta[action]}
    </div>
  )
}
