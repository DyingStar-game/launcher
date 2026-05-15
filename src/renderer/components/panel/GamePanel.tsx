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
import ServerStatus from '@components/ui/feedback/ServerStatus'
import Button from '@components/ui/primitives/Button'
import PanelMessage from '@components/ui/feedback/PanelMessage'

/** Game panel: server status, player count, play button, and status page link. */
export default function GamePanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data: gameData, fetchServerStatus, play, gameRunning } = useGameStore()
  const { data: filesData } = useFilesStore()
  const latestGameInfo = useVersionStore((s) => s.latestGameVersions[activeEnv])
  const { available } = useAvailabilityStore()

  const { status, players } = gameData[activeEnv]
  const { installed, version: localGameVersion } = filesData[activeEnv]
  const accountStatus = useAccountStore((s) => s.data[activeEnv].status)
  const isAuthenticated = accountStatus === 'connected'
  const gameUpdateAvailable = isGameUpdateAvailable(
    installed,
    localGameVersion,
    latestGameInfo?.version ?? null
  )
  const isAvailable = available[activeEnv]

  const { t } = useTranslation()

  useEffect(() => {
    if (!isAvailable) return

    void fetchServerStatus()

    const ms = pollIntervalMinutes() * 60 * 1000
    const id = window.setInterval(() => {
      void fetchServerStatus()
    }, ms)

    return () => window.clearInterval(id)
  }, [activeEnv, isAvailable, fetchServerStatus])

  /** Play is enabled when server is up, game installed, authenticated, and not already running. */
  const canPlay =
    installed &&
    isAvailable &&
    status === 'online' &&
    !gameUpdateAvailable &&
    isAuthenticated &&
    !gameRunning

  const statusPageUrl = statusPageUrlForEnv(activeEnv)
  const canOpenStatusPage = Boolean(statusPageUrl)

  return (
    <div className="ds-panel ds-panel-padded h-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="ds-section-label">{t('universe.game.title')}</h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Server status */}
      <div className="flex items-center gap-2">
        <ServerStatus status={isAvailable ? status : 'unavailable'} />
        <span className="text-sm text-[var(--color-ds-text)]">
          {t(`universe.game.status.${isAvailable ? status : 'unavailable'}`)}
        </span>
      </div>

      {/* Connected players */}
      {isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.game.players', { count: players })}
        </p>
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

        {installed && gameRunning && (
          <PanelMessage variant="info">{t('universe.game.playDisabledRunning')}</PanelMessage>
        )}

        {installed && isAvailable && accountStatus === 'loading' && (
          <PanelMessage variant="info">{t('universe.game.playDisabledAuthLoading')}</PanelMessage>
        )}

        {installed && isAvailable && accountStatus === 'disconnected' && (
          <PanelMessage variant="warning">{t('universe.game.playDisabledAuth')}</PanelMessage>
        )}

        <Button onClick={play} disabled={!canPlay} variant="primary" className="w-full">
          {t('universe.game.play')}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          disabled={!canOpenStatusPage}
          onClick={() => (canOpenStatusPage ? window.open(statusPageUrl, '_blank') : undefined)}
        >
          {t('universe.game.viewStatus')}
        </Button>
      </div>
    </div>
  )
}
