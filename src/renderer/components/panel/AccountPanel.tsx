import { useAccountStore } from '@stores/account'
import { useEnvStore } from '@stores/env'
import { useAvailabilityStore } from '@stores/availability'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/primitives/Button'
import DiscordIcon from '@components/ui/primitives/icons/DiscordIcon'

export default function AccountPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const { available } = useAvailabilityStore()

  const { status, username } = data[activeEnv]
  const isAvailable = available[activeEnv]
  const { t } = useTranslation()

  return (
    <div className="border-box h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.account.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {!isAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.unavailable')}
        </p>
      )}

      {isAvailable && status === 'disconnected' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.disconnected')}
        </p>
      )}

      {isAvailable && status === 'loading' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.loading')}
        </p>
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
