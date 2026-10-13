import { useTranslation } from 'react-i18next'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import type { SocialStatus } from '@lib/socialQueries'
import Button from '@components/atoms/Button'
import ListSkeleton, { type ListSkeletonProps } from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

export type SocialStateMessageProps = {
  status: SocialStatus
  /** Avatar shape of the skeleton rows: square for organisations. */
  avatar?: ListSkeletonProps['avatar']
}

/**
 * Shown instead of the lists when social data is not ready: a skeleton of the list while it
 * loads (ADR 0018), otherwise a message (unavailable, signed out, error with retry).
 */
export default function SocialStateMessage({
  status,
  avatar = 'circle'
}: SocialStateMessageProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const { error, reload } = useSocialSnapshot()
  const showSkeleton = useDelayedFlag(status === 'loading')
  if (status === 'ready' || status === 'idle') return null
  if (status === 'loading') return showSkeleton ? <ListSkeleton avatar={avatar} /> : null

  const message =
    status === 'unavailable'
      ? t('universe.socialPage.state.unavailable')
      : status === 'notSignedIn'
        ? t('universe.socialPage.state.notSignedIn')
        : t(`universe.socialPage.errors.${error ?? 'unknown'}`)

  return (
    <div className="flex flex-col items-start gap-3 p-2">
      <p className="text-sm text-ds-muted">{message}</p>
      {status === 'error' && (
        <Button variant="secondary" onClick={reload}>
          {t('universe.socialPage.state.retry')}
        </Button>
      )}
    </div>
  )
}
