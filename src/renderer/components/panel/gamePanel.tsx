import { useEffect } from 'react'
import { useGameStore } from '@store/game'
import { useFilesStore } from '@store/files'
import { useTranslation } from 'react-i18next'
import ServerStatus from '@components/ui/serverStatus'
import Button from '@components/ui/button'

export default function GamePanel(): React.JSX.Element {
  const { serverStatus, players, play, fetchServerStatus } = useGameStore()
  const { installed } = useFilesStore()
  const { t } = useTranslation()

  useEffect(() => {
    fetchServerStatus()
  }, [])

  const canPlay = installed && serverStatus === 'online'

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
        <ServerStatus status={serverStatus} />
        <span className="text-sm text-[var(--color-ds-text)]">
          {t(`universe.game.status.${serverStatus}`)}
        </span>
      </div>

      {/* Joueurs connectés */}
      <p className="text-[var(--color-ds-muted)] text-sm">
        {t('universe.game.players', { count: players })}
      </p>

      {/* Jeu non installé */}
      {!installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.game.notInstalled')}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <Button
          onClick={play}
          disabled={!canPlay}
          variant="primary"
          className="w-full"
        >
          {t('universe.game.play')}
        </Button>

        <Button variant="secondary" className="w-full">
          {t('universe.game.viewStatus')}
        </Button>
      </div>
    </div>
  )
}