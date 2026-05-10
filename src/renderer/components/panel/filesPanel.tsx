import { useState, useCallback } from 'react'
import { useFilesStore } from '@store/files'
import { useEnvStore } from '@store/env'
import { useVersionStore } from '@store/version'
import { useAvailabilityStore } from '@store/availability'
import type { GameVersionInfo } from '@store/version'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/button'
import InputField from '@components/ui/inputField'
import UpdateAlert from '@components/ui/updateAlert'
import ChangelogModal from '@components/ui/changelogModal'
import { formatReleaseDateDisplay } from '@renderer/lib/formatReleaseDate'

export default function FilesPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, setInstallPath, selectDirectory, install, update, verify, clearCache } = useFilesStore()
  const { available } = useAvailabilityStore()

  const {
    installed, version, releaseDate,
    installing, progress, progressLabel, installPath
  } = data[activeEnv]

  const isAvailable = available[activeEnv]

  const latestGameInfo: GameVersionInfo | undefined = useVersionStore(
    (s) => s.latestGameVersions[activeEnv]
  )
  const latestVersion:     string | null = latestGameInfo?.version     ?? null
  const latestReleaseDate: string | null = latestGameInfo?.releaseDate ?? null

  const gameUpdateAvailable =
    installed &&
    latestVersion !== null &&
    version !== null &&
    latestVersion.localeCompare(version, undefined, { numeric: false }) > 0

  const { t } = useTranslation()

  const [changelogOpen, setChangelogOpen] = useState(false)
  const [changelogLoading, setChangelogLoading] = useState(false)
  const [changelogMd, setChangelogMd] = useState<string | null>(null)

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
    <div className="h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.files.title')}
        </h2>
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
        placeholder="/home/user/games/dyingstar"
        disabled={installing || !isAvailable}
        readOnly
        action={isAvailable ? { label: t('universe.files.browse'), onClick: selectDirectory } : undefined}
      />

      {!isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.files.unavailable')}
        </p>
      )}

      {isAvailable && !installed && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.files.notInstalled')}
        </p>
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
              {progressLabel || t('universe.files.installing')}
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

        {isAvailable && installed && !gameUpdateAvailable && (
          <Button onClick={verify} variant="secondary" disabled={installing}>
            {t('universe.files.verify')}
          </Button>
        )}

        {isAvailable && installed && (
          <Button
            variant="secondary"
            disabled={installing || !installPath}
            onClick={openChangelog}
          >
            {t('universe.files.changelog')}
          </Button>
        )}

        {isAvailable && (
          <Button onClick={clearCache} variant="danger" disabled={installing}>
            {t('universe.files.clearCache')}
          </Button>
        )}
      </div>

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