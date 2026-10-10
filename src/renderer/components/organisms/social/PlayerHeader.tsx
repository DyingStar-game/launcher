import { useTranslation } from 'react-i18next'
import type { PlayerProfile } from '@shared/types/social'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useNavigationStore } from '@stores/navigation'
import Avatar from '@components/atoms/Avatar'
import Button from '@components/atoms/Button'
import PresenceBadge from '@components/molecules/PresenceBadge'
import StatusBadge from '@components/molecules/StatusBadge'
import { playerRelation } from '@lib/playerRelation'
import { useInvitationTargets } from '@hooks/social/useInvitationTargets'
import FriendAction from './FriendAction'
import InviteToOrganisation from './InviteToOrganisation'

/**
 * Identity of a player page (ADR 0012): avatar, name, status (with the star system of a friend
 * in mission) and the relation (friend, request sent), faction and role; then the actions, all
 * full-size buttons — invite to an organisation, add or accept as a friend — or, on the player's
 * own page, the edit button (ADR 0020).
 */
export default function PlayerHeader({ profile }: { profile: PlayerProfile }): React.JSX.Element {
  const { t } = useTranslation()
  const { data } = useSocialSnapshot()
  const { openProfileEdit, openOrganisation } = useNavigationStore()
  const friend = data.friends.find((f) => f.id === profile.id)
  const relation = playerRelation(profile.id, data)
  const invitations = useInvitationTargets(profile)
  const isSelf = relation === 'self'
  const system = profile.status === 'mission' ? friend?.system : undefined
  const statusLabel = system
    ? t('friendStatus.missionIn', { system })
    : t(`friendStatus.${profile.status}`)

  return (
    <div className="flex items-center gap-4">
      <Avatar name={profile.name} size="lg" status={profile.status} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-[var(--color-ds-text)] truncate">{profile.name}</h1>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <PresenceBadge status={profile.status} label={statusLabel} />
          {relation === 'friend' && (
            <StatusBadge icon="friend">{t('universe.socialPage.playerSearch.friend')}</StatusBadge>
          )}
          {relation === 'outgoing' && (
            <StatusBadge icon="pending">
              {t('universe.socialPage.playerSearch.requestSent')}
            </StatusBadge>
          )}
          {invitations.invited.map((organisation) => (
            <StatusBadge
              key={organisation.id}
              icon="pending"
              onOpen={() => openOrganisation(organisation.id)}
            >
              {t('universe.socialPage.manage.invite.invitedTo', { name: organisation.name })}
            </StatusBadge>
          ))}
        </div>
        {(profile.faction || profile.role) && (
          <p className="text-xs text-[var(--color-ds-muted)]">
            {[profile.faction, profile.role].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
      {isSelf ? (
        <Button variant="primary" onClick={() => openProfileEdit(profile.id)}>
          {t('universe.socialPage.profileEdit.action')}
        </Button>
      ) : (
        <div className="flex shrink-0 items-start gap-2">
          {!invitations.pending && (
            <InviteToOrganisation player={profile} organisations={invitations.invitable} />
          )}
          <FriendAction playerId={profile.id} name={profile.name} layout="page" />
        </div>
      )}
    </div>
  )
}
