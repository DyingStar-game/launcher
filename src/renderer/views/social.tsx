import { useEffect, useState } from 'react'
import { useSocialStore } from '@store/social'
import SocialSidebar from '@components/ui/socialSidebar'
import { FriendRow } from '@components/ui/friendRow'
import { OrgaRow } from '@components/ui/orgaRow'
import { RequestRow } from '@components/ui/requestRow'


export default function SocialPage() {
  const { friends, orgas, requests, fetchAll } = useSocialStore()
  const [tab, setTab] = useState('friends')

  useEffect(() => {
    fetchAll()
  }, [])

  return (
    <div className="flex h-full">

      <SocialSidebar current={tab} setCurrent={setTab} />

      <div className="flex-1 p-6 flex flex-col gap-4">

        {/* Header actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold capitalize">{tab}</h1>

          <div className="flex gap-2">
            {tab === 'friends' && (
              <button className="btn">Ajouter un ami</button>
            )}
            {tab === 'organizations' && (
              <button className="btn">Créer une orga</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 overflow-y-auto">

          {tab === 'friends' &&
            friends.map((f) => <FriendRow key={f.id} friend={f} />)}

          {tab === 'organizations' &&
            orgas.map((o) => <OrgaRow key={o.id} orga={o} />)}

          {tab === 'requests' &&
            requests.map((r) => <RequestRow key={r.id} req={r} />)}
        </div>

      </div>
    </div>
  )
}