import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrganisationRank } from '@shared/types/social'
import { ORGANISATION_PERMISSIONS } from '@shared/schemas/social'
import { canActOn } from '@shared/organisationRights'
import type { Subject } from '@stores/navigation'
import { useOrganisationRanks } from '@hooks/social/useSocialSheets'
import { useDeleteRank } from '@hooks/social/useSocialActions'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import Button from '@components/atoms/Button'
import ConfirmDialog from '@components/molecules/ConfirmDialog'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { Badge } from '@components/ui/badge'
import RankForm from './RankForm'

export type OrganisationRanksManageProps = {
  subject: Subject
  /** The player's own rank: they edit and delete only the ranks strictly below it. */
  myRank: OrganisationRank
}

/**
 * Ranks of an organisation, highest first (ADR 0021, `manage_ranks`): create, edit, delete. The
 * CEO rank takes a new name only; the default rank cannot be deleted.
 */
export default function OrganisationRanksManage({
  subject,
  myRank
}: OrganisationRanksManageProps): React.JSX.Element {
  const { t } = useTranslation()
  const state = useOrganisationRanks(subject)
  const remove = useDeleteRank(subject.id)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const showSkeleton = useDelayedFlag(state.kind === 'loading')

  if (state.kind === 'error') return <p className="text-sm text-red-400">{state.message}</p>
  if (state.kind === 'loading') return showSkeleton ? <ListSkeleton rows={3} /> : <></>

  const editable = (rank: OrganisationRank): boolean =>
    (rank.isCeo && myRank.isCeo) || canActOn(myRank, rank)

  return (
    <div className="flex flex-col gap-3">
      {editing === 'new' ? (
        <RankForm organisationId={subject.id} myRank={myRank} onDone={() => setEditing(null)} />
      ) : (
        <div>
          <Button variant="primary" onClick={() => setEditing('new')}>
            {t('universe.socialPage.manage.ranks.create')}
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {state.data.map((rank) =>
          editing === rank.id ? (
            <li key={rank.id}>
              <RankForm
                organisationId={subject.id}
                rank={rank}
                myRank={myRank}
                onDone={() => setEditing(null)}
              />
            </li>
          ) : (
            <li
              key={rank.id}
              className="flex items-center gap-3 rounded-lg border border-ds-border px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-ds-text">
                  {rank.name}{' '}
                  <span className="text-xs font-normal text-ds-muted">
                    {t('universe.socialPage.manage.ranks.priorityValue', {
                      priority: rank.priority
                    })}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {rank.isCeo && <Badge>{t('universe.socialPage.manage.ranks.ceo')}</Badge>}
                  {rank.isDefault && (
                    <Badge variant="outline">{t('universe.socialPage.manage.ranks.default')}</Badge>
                  )}
                  {ORGANISATION_PERMISSIONS.filter((p) => rank.permissions.includes(p)).map((p) => (
                    <Badge key={p} variant="secondary">
                      {t(`universe.socialPage.manage.permissions.${p}`)}
                    </Badge>
                  ))}
                </div>
              </div>
              {editable(rank) && (
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="chip" onClick={() => setEditing(rank.id)}>
                    {t('universe.socialPage.manage.ranks.edit')}
                  </Button>
                  {!rank.isCeo && !rank.isDefault && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="danger" size="chip">
                          {t('universe.socialPage.manage.ranks.delete')}
                        </Button>
                      }
                      title={t('universe.socialPage.manage.ranks.deleteTitle', { name: rank.name })}
                      description={t('universe.socialPage.manage.ranks.deleteDescription')}
                      confirmLabel={t('universe.socialPage.manage.ranks.delete')}
                      onConfirm={() => remove.mutateAsync(rank.id)}
                    />
                  )}
                </div>
              )}
            </li>
          )
        )}
      </ul>
    </div>
  )
}
