import { ChevronDownIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { OrganisationMember, OrganisationRank } from '@shared/types/social'
import { assignableRanks, can, canActOn } from '@shared/organisationRights'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { useOrganisationMembers, useOrganisationRanks } from '@hooks/social/useSocialSheets'
import { useRemoveMember, useSetMemberRank } from '@hooks/social/useSocialActions'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import { getSocialErrorMessage } from '@lib/socialErrors'
import Button from '@components/atoms/Button'
import ConfirmDialog from '@components/molecules/ConfirmDialog'
import ListSkeleton from '@components/molecules/ListSkeleton'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import ListRow from '@components/atoms/ListRow'

export type OrganisationMembersManageProps = {
  subject: Subject
  /** The player's own rank in the organisation. */
  myRank: OrganisationRank
  selfId: string
}

/**
 * Members of an organisation, for its managers (ADR 0021, `manage_members`): on each member
 * strictly below the player, a rank menu (ranks strictly below theirs) and Remove.
 */
export default function OrganisationMembersManage({
  subject,
  myRank,
  selfId
}: OrganisationMembersManageProps): React.JSX.Element {
  const { t } = useTranslation()
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  const { members, total, pending, error, loadMore, loadingMore } = useOrganisationMembers(subject)
  const ranks = useOrganisationRanks(subject)
  const setRank = useSetMemberRank(subject.id)
  const remove = useRemoveMember(subject.id)
  const showSkeleton = useDelayedFlag(pending)
  const assignable = ranks.kind === 'loaded' ? assignableRanks(myRank, ranks.data) : []
  const remaining = total - members.length

  const actsOn = (member: OrganisationMember): boolean =>
    can(myRank, 'manage_members') &&
    member.id !== selfId &&
    canActOn(myRank, { priority: member.rankPriority, isCeo: member.isCeo })

  return (
    <div className="flex flex-col gap-3">
      {showSkeleton && <ListSkeleton rows={4} />}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="flex flex-col gap-1">
        {members.map((member) => (
          <ListRow as="li" key={member.id}>
            <PlayerIdentity
              name={member.name}
              status={member.status}
              onOpen={() => openPlayer(member.id)}
            >
              <span className="text-xs text-ds-muted">{member.rank}</span>
            </PlayerIdentity>
            {actsOn(member) && (
              <div className="flex shrink-0 items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="chip"
                      aria-label={t('universe.socialPage.manage.members.rankAria', {
                        name: member.name
                      })}
                      disabled={assignable.length === 0}
                    >
                      {member.rank}
                      <ChevronDownIcon aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    aria-label={t('universe.socialPage.manage.members.rankAria', {
                      name: member.name
                    })}
                  >
                    <DropdownMenuRadioGroup
                      value={String(member.rankId)}
                      onValueChange={(rankId) =>
                        void setRank.mutateAsync({ playerId: member.id, rankId: Number(rankId) })
                      }
                    >
                      {assignable.map((rank) => (
                        <DropdownMenuRadioItem key={rank.id} value={String(rank.id)}>
                          {rank.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ConfirmDialog
                  trigger={
                    <Button variant="danger" size="chip">
                      {t('universe.socialPage.manage.members.remove')}
                    </Button>
                  }
                  title={t('universe.socialPage.manage.members.removeTitle', { name: member.name })}
                  description={t('universe.socialPage.manage.members.removeDescription')}
                  confirmLabel={t('universe.socialPage.manage.members.remove')}
                  onConfirm={() => remove.mutateAsync(member.id)}
                />
              </div>
            )}
          </ListRow>
        ))}
      </ul>
      {setRank.error && (
        <p role="alert" className="text-sm text-red-400">
          {getSocialErrorMessage(setRank.error, t)}
        </p>
      )}
      {remaining > 0 && (
        <div>
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            {t('universe.socialPage.organisation.loadMore', { count: remaining })}
          </Button>
        </div>
      )}
    </div>
  )
}
