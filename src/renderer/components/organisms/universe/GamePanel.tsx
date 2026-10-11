import { useEffect } from 'react'
import { useGameStore } from '@stores/game'
import { useFilesStore } from '@stores/files'
import { useVersionStore } from '@stores/version'
import { useEnvStore } from '@stores/env'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import { pollIntervalMinutes, statusPageUrlForEnv } from '@lib/env'
import { useAvailabilityStore } from '@stores/availability'
import { useAccountStore } from '@stores/account'
import { useTranslation } from 'react-i18next'
import ServerStatus from '@components/molecules/ServerStatus'
import Button from '@components/atoms/Button'
import { UiSoundProfile } from '@shared/types/sounds'
import PanelMessage from '@components/molecules/PanelMessage'
import Panel from '@components/atoms/Panel'
import SectionLabel from '@components/atoms/SectionLabel'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'

/**
 * Game panel: server status, player count, play button (sign-in with Discord in its place while
 * signed out), and status page link.
 */
export default function GamePanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data: gameData, fetchServerStatus, play, gameRunning, isLaunching } = useGameStore()
  const { data: filesData, syncInstalledVersions } = useFilesStore()
  const latestGameInfo = useVersionStore((s) => s.latestGameVersions[activeEnv])
  const { available } = useAvailabilityStore()

  const { status, players } = gameData[activeEnv]
  const { installed, version: localGameVersion } = filesData[activeEnv]
  const accountStatus = useAccountStore((s) => s.data[activeEnv].status)
  const sessionExpired = useAccountStore((s) => s.data[activeEnv].sessionExpired)
  const login = useAccountStore((s) => s.login)
  const isAuthenticated = accountStatus === 'connected'
  const gameUpdateAvailable = isGameUpdateAvailable(
    installed,
    localGameVersion,
    latestGameInfo?.version ?? null
  )
  const isAvailable = available[activeEnv]

  const { t } = useTranslation()

  useEffect(() => {
    void syncInstalledVersions()
  }, [activeEnv, syncInstalledVersions])

  useEffect(() => {
    if (!isAvailable) return

    void fetchServerStatus()

    const ms = pollIntervalMinutes() * 60 * 1000
    const id = window.setInterval(() => {
      void fetchServerStatus()
    }, ms)

    return () => window.clearInterval(id)
  }, [activeEnv, isAvailable, fetchServerStatus])

  /** Play is enabled when server is up, game installed, authenticated, and not already running/launching. */
  const canPlay =
    installed &&
    isAvailable &&
    status === 'online' &&
    !gameUpdateAvailable &&
    isAuthenticated &&
    !gameRunning &&
    !isLaunching

  /** Signed out where the game could be played: the sign-in takes the Play button's place. */
  const needsSignIn =
    installed && isAvailable && accountStatus !== 'loading' && (!isAuthenticated || sessionExpired)

  const statusPageUrl = statusPageUrlForEnv(activeEnv)
  const canOpenStatusPage = Boolean(statusPageUrl)

  return (
    <Panel className="p-7 h-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SectionLabel as="h2">{t('universe.game.title')}</SectionLabel>
        <div className="h-px flex-1 bg-ds-border" />
      </div>

      {/* Server status */}
      <div className="flex items-center gap-2">
        <ServerStatus status={isAvailable ? status : 'unavailable'} />
        <span className="text-sm text-ds-text">
          {t(`universe.game.status.${isAvailable ? status : 'unavailable'}`)}
        </span>
      </div>

      {/* Connected players */}
      {isAvailable && (
        <p className="text-ds-muted text-sm">{t('universe.game.players', { count: players })}</p>
      )}

      {/* Game not installed */}
      {!installed && <PanelMessage variant="error">{t('universe.game.notInstalled')}</PanelMessage>}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {installed && isAvailable && status === 'maintenance' && (
          <PanelMessage variant="warning">
            {t('universe.game.playDisabledMaintenance')}
          </PanelMessage>
        )}

        {installed && gameUpdateAvailable && (
          <PanelMessage variant="info">{t('universe.game.playDisabledUpdate')}</PanelMessage>
        )}

        {installed && isLaunching && (
          <PanelMessage variant="info">{t('universe.game.playDisabledLaunching')}</PanelMessage>
        )}

        {installed && gameRunning && !isLaunching && (
          <PanelMessage variant="info">{t('universe.game.playDisabledRunning')}</PanelMessage>
        )}

        {installed && isAvailable && accountStatus === 'loading' && (
          <PanelMessage variant="info">{t('universe.game.playDisabledAuthLoading')}</PanelMessage>
        )}

        {installed && isAvailable && sessionExpired && (
          <PanelMessage variant="warning">{t('universe.game.sessionExpired')}</PanelMessage>
        )}

        {installed && isAvailable && accountStatus === 'disconnected' && !sessionExpired && (
          <PanelMessage variant="warning">{t('universe.game.playDisabledAuth')}</PanelMessage>
        )}

        {needsSignIn ? (
          <Button onClick={() => void login()} variant="discord" className="w-full">
            <DiscordIcon className="size-4.5" />
            {t('navbar.account.signIn')}
          </Button>
        ) : (
          <Button
            onClick={() => void play()}
            disabled={!canPlay}
            variant="primary"
            className="w-full"
            soundProfile={UiSoundProfile.PlayGame}
          >
            {isLaunching ? t('universe.game.launching') : t('universe.game.play')}
          </Button>
        )}

        <Button
          variant="secondary"
          className="w-full"
          disabled={!canOpenStatusPage}
          onClick={() => (canOpenStatusPage ? window.open(statusPageUrl, '_blank') : undefined)}
        >
          {t('universe.game.viewStatus')}
        </Button>
      </div>
    </Panel>
  )
}
