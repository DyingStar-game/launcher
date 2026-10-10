import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApiRecruitment } from '@shared/types/social'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useJoinOrganisation } from '@hooks/social/useSocialActions'
import { getSocialErrorMessage } from '@lib/socialErrors'
import StatusBadge from '@components/molecules/StatusBadge'
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
  const { memberships, applications } = useSocialSnapshot().data
  const joinOrga = useJoinOrganisation().mutateAsync
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleJoin = async (): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await joinOrga(id)
      // The social data reloads: membership or the pending application shows as a badge
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  const badge: { label: string; icon: 'member' | 'pending' | 'lock' } | null = memberships.some(
    (m) => m.id === id
  )
    ? { label: t('universe.socialPage.orga.memberBadge'), icon: 'member' }
    : applications.some((a) => a.organisation.id === id)
      ? { label: t('universe.socialPage.orga.applicationBadge'), icon: 'pending' }
      : recruitment === 'closed'
        ? { label: t('universe.socialPage.orga.closedBadge'), icon: 'lock' }
        : null
  const joinLabel =
    recruitment === 'open' ? t('universe.socialPage.joinOrga') : t('universe.socialPage.applyOrga')

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {badge ? (
        <StatusBadge icon={badge.icon}>{badge.label}</StatusBadge>
      ) : (
        <Button
          variant="outline"
          size="chip"
          onClick={handleJoin}
          loading={status === 'loading'}
          aria-label={t('universe.socialPage.orga.joinAria', { name })}
        >
          {joinLabel}
        </Button>
      )}
      {status === 'error' && <span className="text-xs text-red-400 text-right">{errorMsg}</span>}
    </div>
  )
}
