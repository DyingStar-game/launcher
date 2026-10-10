import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'
import { getSocialErrorMessage } from '@lib/socialErrors'
import Badge from '@components/atoms/Badge'
import Button from '@components/atoms/Button'
import { playerRelation } from '@lib/playerRelation'

type Props = {
  playerId: string
  name: string
}

/**
 * Friend action matching a player's relation to the signed-in player (ADR 0008): "Add",
 * "Accept", or a badge (request sent, friend, you). Errors show under the action.
 */
export default function FriendAction({ playerId, name }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, sendFriendRequest, acceptRequest } = useSocialStore()
  const social = data[activeEnv]
  const relation = playerRelation(playerId, social)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await action()
      // The store reloads: the relation, hence the badge, follows
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

  const badge: { label: string; icon: 'self' | 'check' | 'pending' } | null =
    relation === 'self'
      ? { label: t('universe.socialPage.playerSearch.you'), icon: 'self' }
      : relation === 'friend'
        ? { label: t('universe.socialPage.playerSearch.friend'), icon: 'check' }
        : relation === 'outgoing'
          ? { label: t('universe.socialPage.playerSearch.requestSent'), icon: 'pending' }
          : null

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      {badge ? (
        <Badge variant={badge.icon === 'check' ? 'accent' : 'muted'} icon={badge.icon}>
          {badge.label}
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="chip"
          onClick={relation === 'incoming' ? handleAccept : handleAdd}
          disabled={status === 'loading'}
          aria-label={
            relation === 'incoming'
              ? t('universe.socialPage.request.acceptAria', { name })
              : t('universe.socialPage.playerSearch.addAria', { name })
          }
        >
          {status === 'loading'
            ? '...'
            : relation === 'incoming'
              ? t('universe.socialPage.accept')
              : t('universe.socialPage.playerSearch.add')}
        </Button>
      )}
      {status === 'error' && <span className="text-xs text-red-400 text-right">{errorMsg}</span>}
    </div>
  )
}
