import { useEffect } from 'react'
import { useGameStore } from '@store/game'
import { useTranslation } from 'react-i18next'
import ServerStatus from '@components/ui/serverStatus'

export default function GamePanel(): React.JSX.Element {
  const { installed, serverStatus, players, play, fetchServerStatus } = useGameStore()
  const { t } = useTranslation()

  useEffect(() => {
    fetchServerStatus()
  }, [])

  return (
    <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-4">

      {/* Title */}
      <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
        {t('universe.game.title')}
      </h2>

      {/* Server status */}
      <div className="flex items-center gap-2">
        <ServerStatus status={serverStatus} />
        <span className="text-sm text-[var(--color-ds-text)]">
          {t(`universe.game.status.${serverStatus}`)}
        </span>
      </div>

      {/* Players */}
      <p className="text-[var(--color-ds-muted)] text-sm">
        {t('universe.game.players', { count: players })}
      </p>

      {/* Not installed */}
      {!installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.game.notInstalled')}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">

        <button
          onClick={play}
          disabled={!installed || serverStatus !== 'online'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${
            installed && serverStatus === 'online'
              ? 'bg-[var(--color-ds-accent)] text-white hover:opacity-90 cursor-pointer'
              : 'bg-gray-500 text-white opacity-50 cursor-not-allowed'
          }`}
        >
          {t('universe.game.play')}
        </button>

        <button
          className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
        >
          {t('universe.game.viewStatus')}
        </button>
      </div>
    </div>
  )
}