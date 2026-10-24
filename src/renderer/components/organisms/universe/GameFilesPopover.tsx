import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingsIcon } from 'lucide-react'
import { useEnvStore } from '@stores/env'
import { useFilesStore, type ClearGodotCacheOutcome } from '@stores/files'
import { useAvailabilityStore } from '@stores/availability'
import { formatReleaseDateDisplay } from '@lib/formatReleaseDate'
import { toast } from 'sonner'
import Button from '@components/atoms/Button'
import SectionLabel from '@components/atoms/SectionLabel'
import InputField from '@components/molecules/InputField'
import LabelTooltip from '@components/molecules/LabelTooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover'

/** The toast telling how clearing the cache went. */
const CACHE_TOAST = {
  success: { show: toast.success, key: 'universe.files.clearCacheToastOk' },
  partial: { show: toast.warning, key: 'universe.files.clearCacheToastPartial' },
  error: { show: toast.error, key: 'universe.files.clearCacheToastError' }
} as const

export type GameFilesPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Install was asked without a folder: the folder field shows why. */
  pathError?: boolean
}

/**
 * The ⚙ button of the home action bar and its "Game files" panel: installed version, install
 * folder, file check and cache clearing.
 */
export default function GameFilesPopover({
  open,
  onOpenChange,
  pathError = false
}: GameFilesPopoverProps): React.JSX.Element {
  const { t } = useTranslation()
  const activeEnv = useEnvStore((s) => s.activeEnv)
  const { data, setInstallPath, selectDirectory, verify, clearCache } = useFilesStore()
  const available = useAvailabilityStore((s) => s.available[activeEnv])
  const { installed, version, releaseDate, installing, installPath, paused } = data[activeEnv]
  // Why the game's tools are off: they touch the folder the install is writing (ADR 0048)
  const busy = installing ? t('universe.files.busyInstalling') : null

  const [verifying, setVerifying] = useState(false)

  const handleClearCache = useCallback(async () => {
    const outcome: ClearGodotCacheOutcome = await clearCache()
    const { show, key } = CACHE_TOAST[outcome]
    show(t(key))
  }, [clearCache, t])

  const handleVerify = useCallback(async () => {
    setVerifying(true)
    try {
      await verify()
    } finally {
      setVerifying(false)
    }
  }, [verify])

  const pathMissing = pathError && !installPath.trim()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <LabelTooltip label={t('universe.files.title')} side="top">
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon-cta" aria-label={t('universe.files.title')}>
            <SettingsIcon aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </LabelTooltip>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        aria-label={t('universe.files.title')}
        className="w-105 gap-3.5 p-5"
      >
        <SectionLabel as="h2">{t('universe.files.title')}</SectionLabel>

        {installed && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ds-muted">{t('universe.files.versionLabel')}</dt>
            <dd className="font-mono">{version}</dd>
            <dt className="text-ds-muted">{t('universe.files.releaseLabel')}</dt>
            <dd>{formatReleaseDateDisplay(releaseDate)}</dd>
          </dl>
        )}

        {available ? (
          <InputField
            label={t('universe.files.installPath')}
            value={installPath}
            onChange={setInstallPath}
            placeholder={t('universe.files.installPathPlaceholder')}
            // A paused download lives in this folder (ADR 0036)
            disabled={installing || paused !== null}
            readOnly
            action={{ label: t('universe.files.browse'), onClick: selectDirectory }}
            error={pathMissing ? t('universe.files.selectInstallPath') : undefined}
          />
        ) : (
          <p className="text-sm text-ds-muted">{t('universe.files.unavailable')}</p>
        )}

        {installed && (
          // Side by side, sharing the panel's width
          <div className="grid grid-cols-2 gap-2">
            <LabelTooltip label={busy} disabled className="w-full">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => void handleVerify()}
                disabled={installing}
                loading={verifying}
              >
                {t('universe.files.verify')}
              </Button>
            </LabelTooltip>
            <LabelTooltip label={busy} disabled className="w-full">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => void handleClearCache()}
                disabled={installing}
              >
                {t('universe.files.clearCache')}
              </Button>
            </LabelTooltip>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
