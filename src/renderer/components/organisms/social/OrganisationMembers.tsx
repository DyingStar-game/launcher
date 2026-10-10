import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrganisationMember } from '@shared/types/social'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { usePageState } from '@hooks/usePageState'
import { useSocialStore } from '@stores/social'
import Button from '@components/atoms/Button'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import SheetSection from '@components/molecules/SheetSection'
import { getSocialErrorMessage } from '@lib/socialErrors'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'

type Loaded = { subject: Subject; members: OrganisationMember[]; total: number }

type Props = {
  subject: Subject
  /** Called once the members shown before (ADR 0013) are loaded again, or loading failed. */
  onRestored?: () => void
}

/**
 * Every member of an organisation (ADR 0012), highest rank first, 50 at a time with
 * "Load more"; each opens their player page. Back brings the same number of members back
 * (ADR 0013).
 */
export default function OrganisationMembers({ subject, onRestored }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const getOrganisationMembers = useSocialStore((s) => s.getOrganisationMembers)
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  const [, setMembersShown] = usePageState('membersShown', 0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const current = loaded?.subject === subject ? loaded : null

  /** Appends the next page; the first page replaces whatever another subject left. */
  const loadPage = async (offset: number): Promise<void> => {
    setStatus('loading')
    try {
      const page = await getOrganisationMembers(subject.env, subject.id, offset)
      const members = offset > 0 && current ? [...current.members, ...page.members] : page.members
      setLoaded({ subject, members, total: page.total })
      setMembersShown(members.length)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  useEffect(() => {
    let cancelled = false
    // As many members as were shown before Back (read once: later "Load more" writes it)
    const shown = useNavigationStore.getState().pageState.membersShown
    const target = typeof shown === 'number' ? shown : 0

    const restore = async (): Promise<void> => {
      const members: OrganisationMember[] = []
      let total = 0
      do {
        const page = await getOrganisationMembers(subject.env, subject.id, members.length)
        if (page.members.length === 0) break
        members.push(...page.members)
        total = page.total
      } while (members.length < target && members.length < total)
      if (!cancelled) setLoaded({ subject, members, total })
    }

    restore()
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setErrorMsg(getSocialErrorMessage(err, t))
      })
      .finally(() => !cancelled && onRestored?.())
    return () => {
      cancelled = true
    }
  }, [subject, getOrganisationMembers, onRestored, t])

  const members = current?.members ?? []
  const showSkeleton = useDelayedFlag(!current && status !== 'error')
  const remaining = current ? current.total - members.length : 0

  return (
    <SheetSection
      title={t('universe.socialPage.organisation.memberList', { count: current?.total ?? 0 })}
    >
      {showSkeleton && <ListSkeleton rows={4} />}
      {members.length > 0 && (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center px-1 py-1">
              <PlayerIdentity name={m.name} status={m.status} onOpen={() => openPlayer(m.id)}>
                <span className="text-xs text-[var(--color-ds-muted)]">{m.rank}</span>
              </PlayerIdentity>
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && <p className="text-sm text-red-400">{errorMsg}</p>}
      {remaining > 0 && (
        <div>
          <Button
            variant="secondary"
            size="sm"
            loading={status === 'loading'}
            onClick={() => void loadPage(members.length)}
          >
            {t('universe.socialPage.organisation.loadMore', { count: remaining })}
          </Button>
        </div>
      )}
    </SheetSection>
  )
}
