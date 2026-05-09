import { useEffect, useState } from 'react'
import { useSocialStore } from '@store/social'
import { useEnvStore } from '@store/env'
import SocialSidebar from '@components/ui/socialSidebar'
import Button from '@components/ui/button'
import { FriendRow } from '@components/ui/friendRow'
import { OrgaRow } from '@components/ui/orgaRow'
import { RequestRow } from '@components/ui/requestRow'


export default function SocialPage() {
  const { activeEnv } = useEnvStore()
  const { data, fetchAll } = useSocialStore()
  const { friends, requests } = data[activeEnv]
  const [tab, setTab] = useState('friends')

  useEffect(() => {
    fetchAll()
  }, [])

  return (
    <div className="flex h-full bg-[var(--color-ds-bg)]">

      <SocialSidebar current={tab} setCurrent={setTab} />

      <div className="flex-1 min-w-0 p-6 flex flex-col gap-4">

        {/* Header actions */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold capitalize text-[var(--color-ds-text)]">
              {tab}
            </h1>
            <p className="text-xs text-[var(--color-ds-muted)]">
              {tab === 'friends'
                ? 'Gère ta liste d’amis et ton statut.'
                : tab === 'organizations'
                ? 'Organisations, membres et invitations.'
                : 'Demandes en attente.'}
            </p>
          </div>

          <div className="flex gap-2">
            {tab === 'friends' && (
              <Button variant="primary">Ajouter un ami</Button>
            )}
            {tab === 'organizations' && (
              <Button variant="primary">Créer une orga</Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          <div className="h-full overflow-y-auto p-3 flex flex-col gap-2">

            {tab === 'friends' &&
              friends.map((f) => <FriendRow key={f.id} friend={f} />)}

            {tab === 'organizations' &&
              orgas.map((o) => <OrgaRow key={o.id} orga={o} />)}

            {tab === 'requests' &&
              requests.map((r) => <RequestRow key={r.id} req={r} />)}
          </div>
        </div>

      </div>
    </div>
  )
}