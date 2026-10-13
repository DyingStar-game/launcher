import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { useOrganisationMembers } from '@hooks/social/useSocialSheets'
import Button from '@components/atoms/Button'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import SheetSection from '@components/molecules/SheetSection'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import ListRow from '@components/atoms/ListRow'

export type OrganisationMembersProps = {
  subject: Subject
  /** Called once the members are there (the pages loaded before come back from the cache), or loading failed. */
  onRestored?: () => void
}

/**
 * Every member of an organisation (ADR 0012), highest rank first, 50 at a time with
 * "Load more"; each opens their player page. Back brings the same pages back (ADR 0013, 0025).
 */
export default function OrganisationMembers({
  subject,
  onRestored
}: OrganisationMembersProps): React.JSX.Element {
  const { t } = useTranslation()
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  const { members, total, pending, error, loadMore, loadingMore } = useOrganisationMembers(subject)
  const showSkeleton = useDelayedFlag(pending)
  const remaining = total - members.length

  useEffect(() => {
    if (!pending) onRestored?.()
  }, [pending, onRestored])

  return (
    <SheetSection title={t('universe.socialPage.organisation.memberList', { count: total })}>
      {showSkeleton && <ListSkeleton rows={4} />}
      {members.length > 0 && (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {members.map((m) => (
            <ListRow as="li" key={m.id}>
              <PlayerIdentity name={m.name} status={m.status} onOpen={() => openPlayer(m.id)}>
                <span className="text-xs text-ds-muted">{m.rank}</span>
              </PlayerIdentity>
            </ListRow>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {remaining > 0 && (
        <div>
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={loadMore}>
            {t('universe.socialPage.organisation.loadMore', { count: remaining })}
          </Button>
        </div>
      )}
    </SheetSection>
  )
}
