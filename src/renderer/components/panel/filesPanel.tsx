import { useFilesStore } from '@store/files'
import { useTranslation } from 'react-i18next'

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
    <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-4">

      {/* Title */}
      <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
        {t('universe.files.title')}
      </h2>

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
          <button
            onClick={install}
            className="px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t('universe.files.install')}
          </button>
        )}

        {installed && needsUpdate && (
          <button
            onClick={update}
            className="px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t('universe.files.update')}
          </button>
        )}

        {installed && !needsUpdate && (
          <button
            onClick={verify}
            className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
          >
            {t('universe.files.verify')}
          </button>
        )}

        {installed && (
          <button
            className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
          >
            {t('universe.files.changelog')}
          </button>
        )}

        <button
          onClick={clearCache}
          className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-red-400 hover:border-red-400 transition-colors cursor-pointer"
        >
          {t('universe.files.clearCache')}
        </button>
      </div>
    </div>
  )
}