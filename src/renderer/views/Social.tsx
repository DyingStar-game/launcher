import { useEffect, useState } from 'react'
import { useSocialStore } from '@stores/social'
import { useEnvStore } from '@stores/env'
import SocialSidebar from '@components/ui/social/SocialSidebar'
import Button from '@components/ui/primitives/Button'
import InputField from '@components/ui/primitives/InputField'
import { FriendRow } from '@components/ui/social/FriendRow'
import { OrgaRow } from '@components/ui/social/OrgaRow'
import { RequestRow } from '@components/ui/social/RequestRow'

// ─── Formulaire : ajouter un ami ──────────────────────────────────────────────

function AddFriendForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { addFriend } = useSocialStore()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!username.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await addFriend(username)
      setStatus('success')
      setUsername('')
      setTimeout(onClose, 1200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Utilisateur introuvable ou demande déjà envoyée.')
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <p className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        Ajouter un ami
      </p>
      <InputField
        label="Pseudo exact"
        value={username}
        onChange={setUsername}
        placeholder="Entrez un pseudo..."
        disabled={status === 'loading'}
        action={{ label: status === 'loading' ? '...' : 'Envoyer', onClick: handleSubmit }}
      />
      {status === 'success' && (
        <p className="text-xs text-emerald-400">Demande envoyée !</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
      <button
        onClick={onClose}
        className="text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors text-left"
      >
        Annuler
      </button>
    </div>
  )
}

// ─── Formulaire : créer une organisation ──────────────────────────────────────

function CreateOrgaForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { createOrga } = useSocialStore()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await createOrga(name)
      setStatus('success')
      setName('')
      setTimeout(onClose, 1200)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Ce nom d\'organisation est déjà pris.')
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
      <p className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        Créer une organisation
      </p>
      <InputField
        label="Nom de l'organisation"
        value={name}
        onChange={setName}
        placeholder="Entrez un nom unique..."
        disabled={status === 'loading'}
        action={{ label: status === 'loading' ? '...' : 'Créer', onClick: handleSubmit }}
      />
      {status === 'success' && (
        <p className="text-xs text-emerald-400">Organisation créée !</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
      <button
        onClick={onClose}
        className="text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors text-left"
      >
        Annuler
      </button>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'friends' | 'organizations' | 'requests'

const TAB_META: Record<Tab, { label: string; subtitle: string }> = {
  friends: {
    label: 'Amis',
    subtitle: 'Gère ta liste d\'amis et ton statut.'
  },
  organizations: {
    label: 'Organisations',
    subtitle: 'Organisations, membres et invitations.'
  },
  requests: {
    label: 'Demandes',
    subtitle: 'Demandes d\'amis en attente.'
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialPage(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, fetchAll, acceptRequest, declineRequest, joinOrga } = useSocialStore()
  const { friends, orgas, requests } = data[activeEnv]

  const [tab, setTab] = useState<Tab>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateOrga, setShowCreateOrga] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [activeEnv])

  const handleTabChange = (next: string): void => {
    setTab(next as Tab)
    setShowAddFriend(false)
    setShowCreateOrga(false)
  }

  const meta = TAB_META[tab]

  return (
    <div className="flex h-full bg-[var(--color-ds-bg)]">

      <SocialSidebar current={tab} setCurrent={handleTabChange} />

      <div className="flex-1 min-w-0 p-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[var(--color-ds-text)]">
              {meta.label}
            </h1>
            <p className="text-xs text-[var(--color-ds-muted)]">
              {meta.subtitle}
            </p>
          </div>

          <div className="flex gap-2">
            {tab === 'friends' && (
              <Button
                variant="primary"
                onClick={() => { setShowAddFriend((v) => !v); setShowCreateOrga(false) }}
              >
                {showAddFriend ? 'Annuler' : 'Ajouter un ami'}
              </Button>
            )}
            {tab === 'organizations' && (
              <Button
                variant="primary"
                onClick={() => { setShowCreateOrga((v) => !v); setShowAddFriend(false) }}
              >
                {showCreateOrga ? 'Annuler' : 'Créer une orga'}
              </Button>
            )}
          </div>
        </div>

        {/* Formulaires contextuels */}
        {showAddFriend && tab === 'friends' && (
          <AddFriendForm onClose={() => setShowAddFriend(false)} />
        )}
        {showCreateOrga && tab === 'organizations' && (
          <CreateOrgaForm onClose={() => setShowCreateOrga(false)} />
        )}

        {/* Compteur requêtes */}
        {tab === 'requests' && requests.length > 0 && (
          <p className="text-xs text-[var(--color-ds-muted)]">
            {requests.length} demande{requests.length > 1 ? 's' : ''} en attente
          </p>
        )}

        {/* Contenu */}
        <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
          <div className="h-full overflow-y-auto p-3 flex flex-col gap-2">

            {tab === 'friends' && (
              <>
                {friends.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    Aucun ami pour le moment.
                  </p>
                )}
                {friends.map((f) => (
                  <FriendRow key={f.id} friend={f} />
                ))}
              </>
            )}

            {tab === 'organizations' && (
              <>
                {orgas.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    Aucune organisation.
                  </p>
                )}
                {orgas.map((o) => (
                  <OrgaRow key={o.id} orga={o} onJoin={() => joinOrga(o.id)} />
                ))}
              </>
            )}

            {tab === 'requests' && (
              <>
                {requests.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    Aucune demande en attente.
                  </p>
                )}
                {requests.map((r) => (
                  <RequestRow
                    key={r.id}
                    req={r}
                    onAccept={() => acceptRequest(r.id)}
                    onDecline={() => declineRequest(r.id)}
                  />
                ))}
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}