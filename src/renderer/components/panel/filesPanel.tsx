// src/renderer/components/panel/filesPanel.tsx

import { useFilesStore } from '@store/files'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/button'
import InputField from '@components/ui/inputField'

export default function FilesPanel(): React.JSX.Element {
  const {
    installed,
    version,
    releaseDate,
    needsUpdate,
    installing,
    progress,
    progressLabel,
    installPath,
    setInstallPath,
    selectDirectory,
    install,
    update,
    verify,
    clearCache
  } = useFilesStore()

  const { t } = useTranslation()

  return (
    <div className="h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.files.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Répertoire d'installation */}
      <InputField
        label={t('universe.files.installPath')}
        value={installPath}
        onChange={setInstallPath}
        placeholder="/home/user/games/dyingstar"
        disabled={installing}
        readOnly
        action={{
          label: t('universe.files.browse'),
          onClick: selectDirectory
        }}
      />

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

      {/* Barre de progression */}
      {installing && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[var(--color-ds-muted)]">
              {progressLabel || t('universe.files.installing')}
            </p>
            <span className="text-xs text-[var(--color-ds-muted)] tabular-nums">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-ds-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-ds-accent)] transition-all duration-300"
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
            disabled={installing || !installPath}
          >
            {t('universe.files.install')}
          </Button>
        )}

        {installed && needsUpdate && (
          <Button
            onClick={update}
            variant="primary"
            disabled={installing}
          >
            {t('universe.files.update')}
          </Button>
        )}

        {installed && !needsUpdate && (
          <Button
            onClick={verify}
            variant="secondary"
            disabled={installing}
          >
            {t('universe.files.verify')}
          </Button>
        )}

        {installed && (
          <Button variant="secondary" disabled={installing}>
            {t('universe.files.changelog')}
          </Button>
        )}

        <Button
          onClick={clearCache}
          variant="danger"
          disabled={installing}
        >
          {t('universe.files.clearCache')}
        </Button>
      </div>
    </div>
  )
}