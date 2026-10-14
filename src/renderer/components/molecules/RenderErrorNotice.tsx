import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import Panel from '@components/atoms/Panel'

export type RenderErrorNoticeProps = {
  /** Renders the zone again (or reloads the window, for the whole launcher). */
  onRetry: () => void
}

/** Shown in place of a zone that failed to render (ADR 0041), with a button to try again. */
export default function RenderErrorNotice({ onRetry }: RenderErrorNoticeProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex min-h-0 flex-1 flex-col p-6">
      <Panel className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-ds-muted">{t('renderError.message')}</p>
        <Button variant="outline" onClick={onRetry}>
          {t('renderError.retry')}
        </Button>
      </Panel>
    </div>
  )
}
