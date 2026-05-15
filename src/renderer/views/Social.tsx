import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialStore } from '@stores/social'
import { useEnvStore } from '@stores/env'
import SocialSidebar from '@components/ui/social/SocialSidebar'
import Button from '@components/ui/primitives/Button'
import InputField from '@components/ui/primitives/InputField'
import { FriendRow } from '@components/ui/social/FriendRow'
import { OrgaRow } from '@components/ui/social/OrgaRow'
import { RequestRow } from '@components/ui/social/RequestRow'
import { socialPanelAutoCloseMs } from '@lib/env'
import { getSocialErrorMessage } from '@lib/socialErrors'

/** Inline form to send a friend request by username. */
function AddFriendForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
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
      setTimeout(onClose, socialPanelAutoCloseMs())
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t, 'universe.socialPage.errors.friendRequestFailed'))
    }
  }

  return (
    <div className="ds-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        {t('universe.socialPage.addFriendForm.title')}
      </p>
      <InputField
        label={t('universe.socialPage.addFriendForm.usernameLabel')}
        value={username}
        onChange={setUsername}
        placeholder={t('universe.socialPage.addFriendForm.usernamePlaceholder')}
        disabled={status === 'loading'}
        action={{
          label: status === 'loading' ? t('common.loading') : t('common.send'),
          onClick: handleSubmit
        }}
      />
      {status === 'success' && (
        <p className="text-xs text-emerald-400">{t('universe.socialPage.addFriendForm.success')}</p>
      )}
      {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
      <button
        onClick={onClose}
        className="text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors text-left"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}

/** Inline form to create a new organization. */
function CreateOrgaForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
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
      setTimeout(onClose, socialPanelAutoCloseMs())
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  return (
    <div className="ds-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        {t('universe.socialPage.createOrgaForm.title')}
      </p>
      <InputField
        label={t('universe.socialPage.createOrgaForm.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={t('universe.socialPage.createOrgaForm.namePlaceholder')}
        disabled={status === 'loading'}
        action={{
          label: status === 'loading' ? t('common.loading') : t('common.create'),
          onClick: handleSubmit
        }}
      />
      {status === 'success' && (
        <p className="text-xs text-emerald-400">
          {t('universe.socialPage.createOrgaForm.success')}
        </p>
      )}
      {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
      <button
        onClick={onClose}
        className="text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors text-left"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}

type Tab = 'friends' | 'organizations' | 'requests'

/** Full social page: friends, organizations, and friend requests. */
export default function SocialPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, fetchAll, acceptRequest, declineRequest, joinOrga } = useSocialStore()
  const { friends, orgas, requests } = data[activeEnv]

  const [tab, setTab] = useState<Tab>('friends')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateOrga, setShowCreateOrga] = useState(false)

  useEffect(() => {
    void fetchAll()
  }, [activeEnv, fetchAll])

  const handleTabChange = (next: string): void => {
    setTab(next as Tab)
    setShowAddFriend(false)
    setShowCreateOrga(false)
  }

  const tabLabel = t(`universe.socialPage.tabs.${tab}.label`)
  const tabSubtitle = t(`universe.socialPage.tabs.${tab}.subtitle`)

  return (
    <div className="ds-page">
      <SocialSidebar current={tab} setCurrent={handleTabChange} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 min-w-0 p-6">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[var(--color-ds-text)]">{tabLabel}</h1>
            <p className="text-xs text-[var(--color-ds-muted)]">{tabSubtitle}</p>
          </div>

          <div className="flex gap-2">
            {tab === 'friends' && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowAddFriend((v) => !v)
                  setShowCreateOrga(false)
                }}
              >
                {showAddFriend ? t('common.cancel') : t('universe.socialPage.addFriend')}
              </Button>
            )}
            {tab === 'organizations' && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowCreateOrga((v) => !v)
                  setShowAddFriend(false)
                }}
              >
                {showCreateOrga ? t('common.cancel') : t('universe.socialPage.createOrga')}
              </Button>
            )}
          </div>
        </div>

        {showAddFriend && tab === 'friends' && (
          <AddFriendForm onClose={() => setShowAddFriend(false)} />
        )}
        {showCreateOrga && tab === 'organizations' && (
          <CreateOrgaForm onClose={() => setShowCreateOrga(false)} />
        )}

        {tab === 'requests' && requests.length > 0 && (
          <p className="text-xs text-[var(--color-ds-muted)]">
            {t('universe.socialPage.pendingRequests', { count: requests.length })}
          </p>
        )}

        <div className="ds-panel flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-3 flex flex-col gap-2">
            {tab === 'friends' && (
              <>
                {friends.length === 0 && (
                  <p className="text-sm text-[var(--color-ds-muted)] p-2">
                    {t('universe.socialPage.emptyFriends')}
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
                    {t('universe.socialPage.emptyOrganizations')}
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
                    {t('universe.socialPage.emptyRequests')}
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
