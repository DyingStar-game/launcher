import { useTranslation } from 'react-i18next'
import { ExternalLinkIcon, RefreshCwIcon } from 'lucide-react'
import Button from '@components/atoms/Button'

export type LauncherUpdateBarProps = {
  /** The new launcher version. */
  version: string
  /** Its download page; without it the bar only tells. */
  downloadUrl?: string
}

/** Strip telling a new launcher version is out, with its download page; the game stays playable. */
export default function LauncherUpdateBar({
  version,
  downloadUrl
}: LauncherUpdateBarProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className="flex h-12 shrink-0 items-center gap-3.5 border-t border-amber-500/30 bg-amber-500/10 px-7"
    >
      <span className="inline-flex text-ds-text">
        <RefreshCwIcon className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-ds-muted">
        <span className="font-semibold text-ds-text">{t('universe.launcherUpdate.title')}</span>
        {` · ${version}`}
      </p>
      {downloadUrl && (
        <Button variant="primary" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
          {t('universe.launcherUpdate.download')}
          <ExternalLinkIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
