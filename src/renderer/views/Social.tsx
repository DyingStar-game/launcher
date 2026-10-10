import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialStore, type SocialStatus } from '@stores/social'
import { useEnvStore } from '@stores/env'
import { useAccountStore } from '@stores/account'
import SocialSidebar from '@components/ui/social/SocialSidebar'
import Button from '@components/ui/primitives/Button'
import InputField from '@components/ui/primitives/InputField'
import { FriendRow } from '@components/ui/social/FriendRow'
import { OrgaRow } from '@components/ui/social/OrgaRow'
import { RequestRow } from '@components/ui/social/RequestRow'
import PlayerSearch from '@components/ui/social/PlayerSearch'
import { socialPanelAutoCloseMs } from '@lib/env'
import { getSocialErrorMessage } from '@lib/socialErrors'

/** Inline form to create a new organization. */
function CreateOrgaForm({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const { createOrga } = useSocialStore()
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || !ticker.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await createOrga(name, ticker)
      setStatus('success')
      setName('')
      setTicker('')
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
      />
      <InputField
        label={t('universe.socialPage.createOrgaForm.tickerLabel')}
        value={ticker}
        onChange={(value) => setTicker(value.toUpperCase().slice(0, 5))}
        placeholder={t('universe.socialPage.createOrgaForm.tickerPlaceholder')}
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

/** Search box for the organisation directory (name or ticker). */
function OrgaSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, searchOrgas } = useSocialStore()
  const [search, setSearch] = useState(data[activeEnv].orgaSearch)

  return (
    <InputField
      label={t('universe.socialPage.orgaSearch.label')}
      value={search}
      onChange={setSearch}
      placeholder={t('universe.socialPage.orgaSearch.placeholder')}
      action={{
        label: t('universe.socialPage.orgaSearch.action'),
        onClick: () => void searchOrgas(search)
      }}
    />
  )
}

/** Message shown instead of the lists when social data cannot be shown. */
function SocialStateMessage({ status }: { status: SocialStatus }): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data, fetchAll } = useSocialStore()
  const { activeEnv } = useEnvStore()
  if (status === 'ready' || status === 'idle') return null

  const error = data[activeEnv].error
  const message =
    status === 'loading'
      ? t('universe.socialPage.state.loading')
      : status === 'unavailable'
        ? t('universe.socialPage.state.unavailable')
        : status === 'notSignedIn'
          ? t('universe.socialPage.state.notSignedIn')
          : t(`universe.socialPage.errors.${error ?? 'unknown'}`)

  return (
    <div className="flex flex-col items-start gap-3 p-2">
      <p className="text-sm text-[var(--color-ds-muted)]">{message}</p>
      {status === 'error' && (
        <Button variant="secondary" onClick={() => void fetchAll()}>
          {t('universe.socialPage.state.retry')}
        </Button>
      )}
    </div>
  )
}

type Tab = 'friends' | 'players' | 'organizations' | 'requests'

/** Full social page: friends, organizations, and friend requests (ADR 0007). */
export default function SocialPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const accountStatus = useAccountStore((s) => s.data[activeEnv].status)
  const { data, fetchAll, acceptRequest, declineRequest, joinOrga } = useSocialStore()
  const { friends, incoming, outgoing, organisations, status } = data[activeEnv]
  const ready = status === 'ready'

  const [tab, setTab] = useState<Tab>('friends')
  const [showCreateOrga, setShowCreateOrga] = useState(false)

  useEffect(() => {
    void fetchAll()
  }, [activeEnv, accountStatus, fetchAll])

  const handleTabChange = (next: string): void => {
    setTab(next as Tab)
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

          {ready && (
            <div className="flex gap-2">
              {tab === 'friends' && (
                <Button variant="primary" onClick={() => handleTabChange('players')}>
                  {t('universe.socialPage.addFriend')}
                </Button>
              )}
              {tab === 'organizations' && (
                <Button variant="primary" onClick={() => setShowCreateOrga((v) => !v)}>
                  {showCreateOrga ? t('common.cancel') : t('universe.socialPage.createOrga')}
                </Button>
              )}
            </div>
          )}
        </div>

        {ready && showCreateOrga && tab === 'organizations' && (
          <CreateOrgaForm onClose={() => setShowCreateOrga(false)} />
        )}
        {ready && tab === 'organizations' && !showCreateOrga && <OrgaSearch key={activeEnv} />}

        {ready && tab === 'requests' && incoming.length > 0 && (
          <p className="text-xs text-[var(--color-ds-muted)]">
            {t('universe.socialPage.pendingRequests', { count: incoming.length })}
          </p>
        )}

        {ready && tab === 'players' && <PlayerSearch key={activeEnv} />}

        {!(ready && tab === 'players') && (
          <div className="ds-panel flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-3 flex flex-col gap-2">
              <SocialStateMessage status={status} />

              {ready && tab === 'friends' && (
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

              {ready && tab === 'organizations' && (
                <>
                  {organisations.length === 0 && (
                    <p className="text-sm text-[var(--color-ds-muted)] p-2">
                      {t('universe.socialPage.emptyOrganizations')}
                    </p>
                  )}
                  {organisations.map((o) => (
                    <OrgaRow key={o.id} orga={o} onJoin={() => joinOrga(o.id)} />
                  ))}
                </>
              )}

              {ready && tab === 'requests' && (
                <>
                  {incoming.length === 0 && outgoing.length === 0 && (
                    <p className="text-sm text-[var(--color-ds-muted)] p-2">
                      {t('universe.socialPage.emptyRequests')}
                    </p>
                  )}
                  {incoming.map((r) => (
                    <RequestRow
                      key={r.id}
                      req={r}
                      direction="incoming"
                      onAccept={() => acceptRequest(r.id)}
                      onDecline={() => declineRequest(r.id)}
                    />
                  ))}
                  {outgoing.length > 0 && (
                    <p className="ds-section-label px-3 pt-2">
                      {t('universe.socialPage.request.sentTitle')}
                    </p>
                  )}
                  {outgoing.map((r) => (
                    <RequestRow
                      key={r.id}
                      req={r}
                      direction="outgoing"
                      onDecline={() => declineRequest(r.id)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
