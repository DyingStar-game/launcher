import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useAcceptFriendRequest, useSendFriendRequest } from '@hooks/social/useSocialActions'
import { getSocialErrorMessage } from '@lib/socialErrors'
import StatusBadge from '@components/molecules/StatusBadge'
import Button from '@components/atoms/Button'
import { playerRelation } from '@lib/playerRelation'

type Props = {
  playerId: string
  name: string
  /**
   * `list`: a badge or a small button, for a row (search results). `page`: only the button, full
   * size — the page shows the relation elsewhere (player page header).
   */
  layout?: 'list' | 'page'
}

/**
 * Friend action matching a player's relation to the signed-in player (ADR 0008): "Add",
 * "Accept", or a badge (request sent, friend, you). Errors show under the action.
 */
export default function FriendAction({
  playerId,
  name,
  layout = 'list'
}: Props): React.JSX.Element | null {
  const { t } = useTranslation()
  const social = useSocialSnapshot().data
  const sendFriendRequest = useSendFriendRequest().mutateAsync
  const acceptRequest = useAcceptFriendRequest().mutateAsync
  const relation = playerRelation(playerId, social)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await action()
      // The social data reloads: the relation, hence the badge, follows
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  const handleAdd = (): Promise<void> => run(() => sendFriendRequest(playerId))
  const handleAccept = (): Promise<void> => {
    const request = social.incoming.find((r) => r.playerId === playerId)
    return run(async () => {
      if (request) await acceptRequest(request.id)
    })
  }

  const badge: { label: string; icon: 'self' | 'friend' | 'pending' } | null =
    relation === 'self'
      ? { label: t('universe.socialPage.playerSearch.you'), icon: 'self' }
      : relation === 'friend'
        ? { label: t('universe.socialPage.playerSearch.friend'), icon: 'friend' }
        : relation === 'outgoing'
          ? { label: t('universe.socialPage.playerSearch.requestSent'), icon: 'pending' }
          : null

  if (badge && layout === 'page') return null

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {badge ? (
        <StatusBadge icon={badge.icon}>{badge.label}</StatusBadge>
      ) : (
        <Button
          variant={layout === 'page' ? 'primary' : 'outline'}
          size={layout === 'page' ? 'md' : 'chip'}
          onClick={relation === 'incoming' ? handleAccept : handleAdd}
          loading={status === 'loading'}
          aria-label={
            relation === 'incoming'
              ? t('universe.socialPage.request.acceptAria', { name })
              : t('universe.socialPage.playerSearch.addAria', { name })
          }
        >
          {relation === 'incoming'
            ? t('universe.socialPage.accept')
            : t('universe.socialPage.playerSearch.add')}
        </Button>
      )}
      {status === 'error' && <span className="text-xs text-red-400 text-right">{errorMsg}</span>}
    </div>
  )
}
