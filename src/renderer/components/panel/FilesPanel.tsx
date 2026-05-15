import { useState, useCallback, useEffect } from 'react'
import { useFilesStore } from '@stores/files'
import { useEnvStore } from '@stores/env'
import { useVersionStore } from '@stores/version'
import { useAvailabilityStore } from '@stores/availability'
import type { GameVersionInfo } from '@stores/version'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/primitives/Button'
import InputField from '@components/ui/primitives/InputField'
import UpdateAlert from '@components/ui/feedback/UpdateAlert'
import ChangelogModal from '@components/ui/overlays/ChangelogModal'
import { formatReleaseDateDisplay } from '@lib/formatReleaseDate'
import { formatInstallProgress } from '@lib/formatInstallProgress'
import { isGameUpdateAvailable } from '@lib/isGameUpdateAvailable'
import { toastDurationMs } from '@lib/env'

/** Files panel: install path, install/update progress, changelog, and cache clear. */
export default function FilesPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, setInstallPath, selectDirectory, install, update, clearCache } = useFilesStore()
  const { available } = useAvailabilityStore()

  const { installed, version, releaseDate, installing, progress, progressEvent, installPath } =
    data[activeEnv]

  const isAvailable = available[activeEnv]

  const latestGameInfo: GameVersionInfo | undefined = useVersionStore(
    (s) => s.latestGameVersions[activeEnv]
  )
  const latestVersion: string | null = latestGameInfo?.version ?? null
  const latestReleaseDate: string | null = latestGameInfo?.releaseDate ?? null

  const gameUpdateAvailable = isGameUpdateAvailable(installed, version, latestVersion)

  const { t } = useTranslation()
  const progressText = formatInstallProgress(t, progressEvent)

  const [changelogOpen, setChangelogOpen] = useState(false)
  const [changelogLoading, setChangelogLoading] = useState(false)
  const [changelogMd, setChangelogMd] = useState<string | null>(null)
  const [cacheToast, setCacheToast] = useState<'success' | 'partial' | 'error' | null>(null)

  useEffect(() => {
    if (!cacheToast) return
    const id = window.setTimeout(() => setCacheToast(null), toastDurationMs())
    return () => window.clearTimeout(id)
  }, [cacheToast])

  const handleClearCache = useCallback(async () => {
    const outcome = await clearCache()
    setCacheToast(outcome)
  }, [clearCache])

  const displayReleaseDate = formatReleaseDateDisplay(releaseDate)

  const openChangelog = useCallback(async () => {
    if (!installPath) return
    setChangelogMd(null)
    setChangelogOpen(true)
    setChangelogLoading(true)
    try {
      const text = await window.api.readChangelog(installPath)
      setChangelogMd(text)
    } catch (err) {
      console.error('[FilesPanel] Changelog :', err)
      setChangelogMd(null)
    } finally {
      setChangelogLoading(false)
    }
  }, [installPath])

  return (
    <div className="ds-panel ds-panel-padded relative h-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="ds-section-label">{t('universe.files.title')}</h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {gameUpdateAvailable && latestVersion && (
        <UpdateAlert
          variant="game"
          currentVersion={version ?? undefined}
          latestVersion={latestVersion}
          latestReleaseDate={
            latestReleaseDate ? formatReleaseDateDisplay(latestReleaseDate) : undefined
          }
        />
      )}

      <InputField
        label={t('universe.files.installPath')}
        value={installPath}
        onChange={setInstallPath}
        placeholder={t('universe.files.installPathPlaceholder')}
        disabled={installing || !isAvailable}
        readOnly
        action={
          isAvailable ? { label: t('universe.files.browse'), onClick: selectDirectory } : undefined
        }
      />

      {!isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">{t('universe.files.unavailable')}</p>
      )}

      {isAvailable && !installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">{t('universe.files.notInstalled')}</p>
      )}

      {installed && (
        <div className="flex flex-col gap-1">
          <p className="text-[var(--color-ds-muted)] text-sm">
            {t('universe.files.version', { version })}
          </p>
          <p className="text-[var(--color-ds-muted)] text-sm">
            {t('universe.files.releaseDate', { date: displayReleaseDate })}
          </p>
        </div>
      )}

      {installing && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[var(--color-ds-muted)]">
              {progressText || t('universe.files.installing')}
            </p>
            <span className="text-xs text-[var(--color-ds-muted)] tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-ds-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-ds-accent)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        {!isAvailable && (
          <Button variant="secondary" disabled className="w-full">
            {t('universe.files.unavailableBtn')}
          </Button>
        )}

        {isAvailable && !installed && (
          <Button onClick={install} variant="primary" disabled={installing || !installPath}>
            {t('universe.files.install')}
          </Button>
        )}

        {isAvailable && installed && gameUpdateAvailable && (
          <Button onClick={update} variant="primary" disabled={installing}>
            {t('universe.files.update')}
          </Button>
        )}

        {/* {isAvailable && installed && !gameUpdateAvailable && (
          <Button onClick={verify} variant="secondary" disabled={installing}>
            {t('universe.files.verify')}
          </Button>
        )} */}

        {isAvailable && installed && (
          <Button variant="secondary" disabled={installing || !installPath} onClick={openChangelog}>
            {t('universe.files.changelog')}
          </Button>
        )}

        {isAvailable && installed && (
          <Button onClick={handleClearCache} variant="danger" disabled={installing}>
            {t('universe.files.clearCache')}
          </Button>
        )}
      </div>

      {cacheToast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'pointer-events-none absolute bottom-4 right-4 z-10 max-w-[min(calc(100%-2rem),22rem)]',
            'rounded-lg border px-3 py-2 text-right text-xs font-medium shadow-lg',
            cacheToast === 'success'
              ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200'
              : cacheToast === 'partial'
                ? 'border-amber-500/35 bg-amber-500/12 text-amber-100'
                : 'border-red-500/35 bg-red-500/12 text-red-200'
          ].join(' ')}
        >
          {cacheToast === 'success' && t('universe.files.clearCacheToastOk')}
          {cacheToast === 'partial' && t('universe.files.clearCacheToastPartial')}
          {cacheToast === 'error' && t('universe.files.clearCacheToastError')}
        </div>
      )}

      <ChangelogModal
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        title={t('universe.files.changelogModalTitle', { version: version ?? '—' })}
        loading={changelogLoading}
        loadingLabel={t('universe.files.changelogLoading')}
        markdown={changelogMd}
        emptyLabel={t('universe.files.changelogMissing')}
      />
    </div>
  )
}
