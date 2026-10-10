import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useSocialStore, type SocialStatus } from '@stores/social'
import Button from '@components/atoms/Button'

/** Message shown instead of the lists when social data cannot be shown. */
export default function SocialStateMessage({
  status
}: {
  status: SocialStatus
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data, fetchAll } = useSocialStore()
  const { activeEnv } = useEnvStore()
  if (status === 'ready' || status === 'idle') return null

  const error = data[activeEnv].error
  const message =
    status === 'loading'
      ? t('universe.socialPage.state.loading')
      : status === 'unavailable'
        ? t('universe.socialPage.state.unavailable')
        : status === 'notSignedIn'
          ? t('universe.socialPage.state.notSignedIn')
          : t(`universe.socialPage.errors.${error ?? 'unknown'}`)

  return (
    <div className="flex flex-col items-start gap-3 p-2">
      <p className="text-sm text-[var(--color-ds-muted)]">{message}</p>
      {status === 'error' && (
        <Button variant="secondary" onClick={() => void fetchAll()}>
          {t('universe.socialPage.state.retry')}
        </Button>
      )}
    </div>
  )
}
