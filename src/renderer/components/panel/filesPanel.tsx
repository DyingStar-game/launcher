import { useFilesStore } from '@store/files'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/button'

export default function FilesPanel(): React.JSX.Element {
  const {
    installed,
    version,
    releaseDate,
    needsUpdate,
    installing,
    progress,
    install,
    update,
    verify,
    clearCache
  } = useFilesStore()

  const { t } = useTranslation()

  return (
    <div className="h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.files.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Infos */}
      {!installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.files.notInstalled')}
        </p>
      )}

      {installed && (
        <>
          <p className="text-[var(--color-ds-muted)] text-sm">
            {t('universe.files.version', { version })}
          </p>
          <p className="text-[var(--color-ds-muted)] text-sm">
            {t('universe.files.releaseDate', { date: releaseDate })}
          </p>
        </>
      )}

      {/* Progress bar */}
      {installing && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-ds-muted)]">
            {t('universe.files.installing')}
          </p>
          <div className="w-full h-2 bg-[var(--color-ds-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-ds-accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto">

        {!installed && (
          <Button
            onClick={install}
            variant="primary"
          >
            {t('universe.files.install')}
          </Button>
        )}

        {installed && needsUpdate && (
          <Button
            onClick={update}
            variant="primary"
          >
            {t('universe.files.update')}
          </Button>
        )}

        {installed && !needsUpdate && (
          <Button
            onClick={verify}
            variant="secondary"
          >
            {t('universe.files.verify')}
          </Button>
        )}

        {installed && (
          <Button variant="secondary">
            {t('universe.files.changelog')}
          </Button>
        )}

        <Button
          onClick={clearCache}
          variant="danger"
        >
          {t('universe.files.clearCache')}
        </Button>
      </div>
    </div>
  )
}