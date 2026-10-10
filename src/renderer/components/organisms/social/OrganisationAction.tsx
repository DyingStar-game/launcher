import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiRecruitment } from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'
import { getSocialErrorMessage } from '@lib/socialErrors'
import Badge from '@components/atoms/Badge'
import Button from '@components/atoms/Button'

type Props = {
  id: string
  name: string
  recruitment: ApiRecruitment
}

/**
 * Join action of an organisation (ADR 0010): "Join" when open, "Apply" when recruiting on
 * application, or a badge — member, application sent, closed. Errors show under the action.
 */
export default function OrganisationAction({ id, name, recruitment }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, joinOrga } = useSocialStore()
  const { memberOf, appliedTo } = data[activeEnv]
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleJoin = async (): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await joinOrga(id)
      // The store reloads: membership or the pending application shows as a badge
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  const badge = memberOf.includes(id)
    ? t('universe.socialPage.orga.memberBadge')
    : appliedTo.includes(id)
      ? t('universe.socialPage.orga.applicationBadge')
      : recruitment === 'closed'
        ? t('universe.socialPage.orga.closedBadge')
        : null
  const joinLabel =
    recruitment === 'open' ? t('universe.socialPage.joinOrga') : t('universe.socialPage.applyOrga')

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {badge ? (
        <Badge variant={memberOf.includes(id) ? 'accent' : 'muted'}>{badge}</Badge>
      ) : (
        <Button
          variant="outline"
          size="chip"
          onClick={handleJoin}
          disabled={status === 'loading'}
          aria-label={t('universe.socialPage.orga.joinAria', { name })}
        >
          {status === 'loading' ? '...' : joinLabel}
        </Button>
      )}
      {status === 'error' && <span className="text-xs text-red-400 text-right">{errorMsg}</span>}
    </div>
  )
}
