import { useEffect } from 'react'
import { useGameStore } from '@store/game'
import { useFilesStore } from '@store/files'
import { useVersionStore } from '@store/version'
import { useEnvStore, type Env } from '@store/env'
import { isGameUpdateAvailable } from '@renderer/lib/isGameUpdateAvailable'
import { useAvailabilityStore } from '@store/availability'
import { useAccountStore } from '@store/account'
import { useTranslation } from 'react-i18next'
import ServerStatus from '@components/ui/serverStatus'
import Button from '@components/ui/button'

function statusPageUrlForEnv(env: Env): string {
  const raw =
    env === 'universe'
      ? import.meta.env.VITE_STATUS_PAGE_UNIVERSE
      : import.meta.env.VITE_STATUS_PAGE_TESTING
  return (raw ?? '').trim()
}

/** Minutes entre deux appels statut + joueurs ; borne pour éviter valeurs absurdes. */
function pollIntervalMinutes(): number {
  const raw = import.meta.env.VITE_SERVER_STATUS_POLL_MINUTES ?? '5'
  let n = Number.parseFloat(String(raw).trim())
  if (!Number.isFinite(n) || n < 1) n = 5
  if (n > 24 * 60) n = 24 * 60
  return n
}

export default function GamePanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data: gameData, fetchServerStatus, play } = useGameStore()
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

  /** Opérationnel, à jour, connecté — sinon bouton désactivé. */
  const canPlay =
    installed &&
    isAvailable &&
    status === 'online' &&
    !gameUpdateAvailable &&
    isAuthenticated

  const statusPageUrl = statusPageUrlForEnv(activeEnv)
  const canOpenStatusPage = Boolean(statusPageUrl)

  return (
    <div className="h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.game.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Statut serveur */}
      <div className="flex items-center gap-2">
        <ServerStatus status={isAvailable ? status : 'unavailable'} />
        <span className="text-sm text-[var(--color-ds-text)]">
          {t(`universe.game.status.${isAvailable ? status : 'unavailable'}`)}
        </span>
      </div>

      {/* Joueurs connectés */}
      {isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.game.players', { count: players })}
        </p>
      )}

      {/* Jeu non installé */}
      {!installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.game.notInstalled')}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {installed && isAvailable && status === 'maintenance' && (
          <p className="text-amber-400/95 text-xs leading-snug">
            {t('universe.game.playDisabledMaintenance')}
          </p>
        )}

        {installed && gameUpdateAvailable && (
          <p className="text-sky-300/95 text-xs leading-snug">
            {t('universe.game.playDisabledUpdate')}
          </p>
        )}

        {installed && isAvailable && accountStatus === 'loading' && (
          <p className="text-[var(--color-ds-muted)] text-xs leading-snug">
            {t('universe.game.playDisabledAuthLoading')}
          </p>
        )}

        {installed && isAvailable && accountStatus === 'disconnected' && (
          <p className="text-amber-400/95 text-xs leading-snug">
            {t('universe.game.playDisabledAuth')}
          </p>
        )}

        <Button
          onClick={play}
          disabled={!canPlay}
          variant="primary"
          className="w-full"
        >
          {t('universe.game.play')}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          disabled={!canOpenStatusPage}
          onClick={() =>
            canOpenStatusPage ? window.open(statusPageUrl, '_blank') : undefined
          }
        >
          {t('universe.game.viewStatus')}
        </Button>
      </div>
    </div>
  )
}