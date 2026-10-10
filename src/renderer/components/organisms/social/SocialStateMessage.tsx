import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useSocialStore, type SocialStatus } from '@stores/social'
import Button from '@components/atoms/Button'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

/**
 * Shown instead of the lists when social data is not ready: a skeleton of the list while it
 * loads (ADR 0018), otherwise a message (unavailable, signed out, error with retry).
 */
export default function SocialStateMessage({
  status,
  avatar = 'circle'
}: {
  status: SocialStatus
  /** Avatar shape of the skeleton rows: square for organisations. */
  avatar?: 'circle' | 'square'
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data, fetchAll } = useSocialStore()
  const { activeEnv } = useEnvStore()
  const showSkeleton = useDelayedFlag(status === 'loading')
  if (status === 'ready' || status === 'idle') return null
  if (status === 'loading') return showSkeleton ? <ListSkeleton avatar={avatar} /> : null

  const error = data[activeEnv].error
  const message =
    status === 'unavailable'
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
