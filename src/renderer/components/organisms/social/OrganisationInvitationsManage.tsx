import { useTranslation } from 'react-i18next'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { useOrganisationRequests } from '@hooks/social/useSocialSheets'
import { useAnswerApplication } from '@hooks/social/useSocialActions'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import Button from '@components/atoms/Button'
import ConfirmDialog from '@components/molecules/ConfirmDialog'
import ListSkeleton from '@components/molecules/ListSkeleton'
import PlayerIdentity from '@components/molecules/PlayerIdentity'

/**
 * Invitations an organisation sent and nobody answered yet (ADR 0021, 0024, `invite`), each
 * withdrawable. Players are invited from their sheet; applications are answered from the social
 * page.
 */
export default function OrganisationInvitationsManage({
  subject
}: {
  subject: Subject
}): React.JSX.Element {
  const { t } = useTranslation()
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  const state = useOrganisationRequests(subject)
  const answer = useAnswerApplication()
  const showSkeleton = useDelayedFlag(state.kind === 'loading')

  if (state.kind === 'error') return <p className="text-sm text-red-400">{state.message}</p>
  if (state.kind === 'loading') return showSkeleton ? <ListSkeleton rows={3} /> : <></>

  const invitations = state.data.filter((r) => r.kind === 'invitation')
  if (invitations.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ds-muted)]">
        {t('universe.socialPage.manage.invitations.empty')}
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex items-center gap-3 px-1 py-1">
          <PlayerIdentity
            name={invitation.player.name}
            onOpen={() => openPlayer(invitation.player.id)}
          />
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="chip">
                {t('universe.socialPage.manage.invitations.withdraw')}
              </Button>
            }
            title={t('universe.socialPage.manage.invitations.withdrawTitle', {
              name: invitation.player.name
            })}
            description={t('universe.socialPage.manage.invitations.withdrawDescription')}
            confirmLabel={t('universe.socialPage.manage.invitations.withdraw')}
            onConfirm={() =>
              answer.mutateAsync({
                organisationId: subject.id,
                requestId: invitation.id,
                accept: false
              })
            }
          />
        </li>
      ))}
    </ul>
  )
}
