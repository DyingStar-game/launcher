import { useTranslation } from 'react-i18next'
import type { OrganisationProfile } from '@shared/types/social'
import { canManage } from '@shared/organisationRights'
import { useNavigationStore } from '@stores/navigation'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useRemoveMember } from '@hooks/social/useSocialActions'
import Avatar from '@components/atoms/Avatar'
import Button from '@components/atoms/Button'
import ConfirmDialog from '@components/molecules/ConfirmDialog'
import OrganisationAction from './OrganisationAction'

/**
 * Identity of an organisation page (ADR 0012): ticker avatar, name, recruitment, and the join
 * action — or, for a member, Manage (with a management right) and Leave (not the CEO, ADR 0021).
 */
export default function OrganisationHeader({
  organisation
}: {
  organisation: OrganisationProfile
}): React.JSX.Element {
  const { t } = useTranslation()
  const { data } = useSocialSnapshot()
  const openOrganisationManage = useNavigationStore((s) => s.openOrganisationManage)
  const leave = useRemoveMember(organisation.id)
  const membership = data.memberships.find((m) => m.id === organisation.id)

  return (
    <div className="flex items-center gap-4">
      <Avatar
        name={organisation.name}
        label={organisation.ticker.slice(0, 3)}
        size="lg"
        shape="square"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-[var(--color-ds-text)] truncate">
          {organisation.name}{' '}
          <span className="text-base font-normal text-[var(--color-ds-muted)]">
            [{organisation.ticker}]
          </span>
        </h1>
        <p className="text-xs text-[var(--color-ds-muted)]">
          {t(`universe.socialPage.organisation.recruitment.${organisation.recruitment}`)}
        </p>
      </div>
      {membership ? (
        <div className="flex shrink-0 items-center gap-2">
          {canManage(membership.rank) && (
            <Button variant="primary" onClick={() => openOrganisationManage(organisation.id)}>
              {t('universe.socialPage.manage.action')}
            </Button>
          )}
          {!membership.rank.isCeo && (
            <ConfirmDialog
              trigger={<Button variant="outline">{t('universe.socialPage.manage.leave')}</Button>}
              title={t('universe.socialPage.manage.leaveTitle', { name: organisation.name })}
              description={t('universe.socialPage.manage.leaveDescription')}
              confirmLabel={t('universe.socialPage.manage.leave')}
              onConfirm={() => leave.mutateAsync(data.selfId)}
            />
          )}
        </div>
      ) : (
        <OrganisationAction
          id={organisation.id}
          name={organisation.name}
          recruitment={organisation.recruitment}
        />
      )}
    </div>
  )
}
