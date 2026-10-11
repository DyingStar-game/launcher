import { useAccountStore } from '@stores/account'
import { useEnvStore } from '@stores/env'
import { useAvailabilityStore } from '@stores/availability'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'
import Panel from '@components/atoms/Panel'
import SectionLabel from '@components/atoms/SectionLabel'

/** Account panel: Discord login/logout and session display per environment. */
export default function AccountPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const { available } = useAvailabilityStore()

  const { status, username } = data[activeEnv]
  const isAvailable = available[activeEnv]
  const { t } = useTranslation()

  return (
    <Panel className="p-7 h-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <SectionLabel as="h2">{t('universe.account.title')}</SectionLabel>
        <div className="h-px flex-1 bg-ds-border" />
      </div>

      {!isAvailable && <p className="text-ds-muted text-sm">{t('universe.account.unavailable')}</p>}

      {isAvailable && status === 'disconnected' && (
        <p className="text-ds-muted text-sm">{t('universe.account.disconnected')}</p>
      )}

      {isAvailable && status === 'loading' && (
        <p className="text-ds-muted text-sm">{t('universe.account.loading')}</p>
      )}

      {isAvailable && status === 'connected' && (
        <p className="text-ds-text text-sm">{t('universe.account.connectedAs', { username })}</p>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        {!isAvailable && (
          <Button variant="secondary" className="w-full" disabled>
            {t('universe.account.unavailableBtn')}
          </Button>
        )}

        {isAvailable && status === 'disconnected' && (
          <Button onClick={login} variant="primary" className="w-full">
            <DiscordIcon className="size-5" />
            {t('universe.account.login')}
          </Button>
        )}

        {isAvailable && status === 'loading' && (
          <Button onClick={cancelLogin} variant="secondary" className="w-full">
            {t('universe.account.cancel')}
          </Button>
        )}

        {isAvailable && status === 'connected' && (
          <Button onClick={logout} variant="danger" className="w-full">
            {t('universe.account.logout')}
          </Button>
        )}
      </div>
    </Panel>
  )
}
