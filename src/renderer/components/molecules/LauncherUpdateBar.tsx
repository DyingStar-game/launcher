import { useTranslation } from 'react-i18next'
import { ExternalLinkIcon, RefreshCwIcon, RotateCcwIcon } from 'lucide-react'
import Button from '@components/atoms/Button'
import LabelTooltip from '@components/molecules/LabelTooltip'
import { Progress } from '@components/ui/progress'

export type LauncherUpdateBarProps = {
  /** The new launcher version. */
  version: string
  /** Its download progress (0–100) while it downloads in the background (ADR 0050). */
  progress?: number
  /** Restarts on the downloaded launcher: given once it is ready (ADR 0050). */
  onRestart?: () => void
  /** Why the restart waits (the game runs or installs), in its tooltip; null when it can restart. */
  restartBlockedReason?: string | null
  /** The restart was asked, the launcher is quitting. */
  restarting?: boolean
  /** Its download page or file, when it cannot update itself; without it the bar only tells. */
  downloadUrl?: string
  /** The download button's label, "Download" by default. */
  downloadLabel?: string
  /** A word after the version, e.g. when the update installs. */
  note?: string
}

/**
 * Strip telling a new launcher version is out; the game stays playable. It updates in place where
 * it can (download progress, then a restart button, ADR 0050), else links to its download page.
 */
export default function LauncherUpdateBar({
  version,
  progress,
  onRestart,
  restartBlockedReason = null,
  restarting = false,
  downloadUrl,
  downloadLabel,
  note
}: LauncherUpdateBarProps): React.JSX.Element {
  const { t } = useTranslation()

  const title = onRestart
    ? t('universe.launcherUpdate.ready')
    : progress !== undefined
      ? t('universe.launcherUpdate.downloading')
      : t('universe.launcherUpdate.title')

  return (
    <div
      role="status"
      className="flex h-12 shrink-0 items-center gap-3.5 border-t border-amber-500/30 bg-amber-500/10 px-7"
    >
      <span className="inline-flex text-ds-text">
        <RefreshCwIcon className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-ds-muted">
        <span className="font-semibold text-ds-text">{title}</span>
        {` · ${version}`}
        {note && ` · ${note}`}
      </p>
      {onRestart ? (
        <LabelTooltip label={restartBlockedReason} disabled={restartBlockedReason !== null}>
          <Button
            variant="primary"
            size="sm"
            loading={restarting}
            disabled={restartBlockedReason !== null}
            onClick={onRestart}
          >
            <RotateCcwIcon aria-hidden="true" />
            {t('universe.launcherUpdate.restart')}
          </Button>
        </LabelTooltip>
      ) : progress !== undefined ? (
        <div className="flex w-60 shrink-0 items-center gap-3">
          <Progress value={progress} aria-label={title} />
          <span className="w-12 text-right text-sm text-ds-muted tabular-nums">
            {t('universe.launcherUpdate.percent', { percent: progress })}
          </span>
        </div>
      ) : (
        downloadUrl && (
          <Button variant="primary" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
            {downloadLabel ?? t('universe.launcherUpdate.download')}
            <ExternalLinkIcon aria-hidden="true" />
          </Button>
        )
      )}
    </div>
  )
}
