import { useAccountStore } from '@stores/account'
import { useEnvStore } from '@stores/env'
import { useAvailabilityStore } from '@stores/availability'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/primitives/Button'
import DiscordIcon from '@components/ui/primitives/icons/DiscordIcon'

/** Account panel: Discord login/logout and session display per environment. */
export default function AccountPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const { available } = useAvailabilityStore()

  const { status, username } = data[activeEnv]
  const isAvailable = available[activeEnv]
  const { t } = useTranslation()

  return (
    <div className="ds-panel ds-panel-padded border-box h-full flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h2 className="ds-section-label">{t('universe.account.title')}</h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {!isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">{t('universe.account.unavailable')}</p>
      )}

      {isAvailable && status === 'disconnected' && (
        <p className="text-[var(--color-ds-muted)] text-sm">{t('universe.account.disconnected')}</p>
      )}

      {isAvailable && status === 'loading' && (
        <p className="text-[var(--color-ds-muted)] text-sm">{t('universe.account.loading')}</p>
      )}

      {isAvailable && status === 'connected' && (
        <p className="text-[var(--color-ds-text)] text-sm">
          {t('universe.account.connectedAs', { username })}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        {!isAvailable && (
          <Button variant="secondary" className="w-full" disabled>
            {t('universe.account.unavailableBtn')}
          </Button>
        )}

        {isAvailable && status === 'disconnected' && (
          <Button onClick={login} variant="primary" className="w-full">
            <DiscordIcon className="w-5 h-5" />
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
    </div>
  )
}
