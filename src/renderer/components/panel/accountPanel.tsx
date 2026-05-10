import { useAccountStore } from '@store/account'
import { useEnvStore } from '@store/env'
import { useTranslation } from 'react-i18next'
import { ENV_CAPABILITIES } from '@config/envCapabilities'
import Button from '@components/ui/button'

export default function AccountPanel(): React.JSX.Element {
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const { status, username } = data[activeEnv]
  const { authAvailable } = ENV_CAPABILITIES[activeEnv]
  const { t } = useTranslation()

  return (
    <div className="border-box h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.account.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

      {/* Env non disponible */}
      {!authAvailable && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.unavailable')}
        </p>
      )}

      {/* Status */}
      {authAvailable && status === 'disconnected' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.disconnected')}
        </p>
      )}

      {authAvailable && status === 'loading' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.loading')}
        </p>
      )}

      {authAvailable && status === 'connected' && (
        <p className="text-[var(--color-ds-text)] text-sm">
          {t('universe.account.connectedAs', { username })}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">

        {/* Auth non disponible pour cet env */}
        {!authAvailable && (
          <Button variant="secondary" className="w-full" disabled>
            {t('universe.account.unavailableBtn')}
          </Button>
        )}

        {/* Déconnecté */}
        {authAvailable && status === 'disconnected' && (
          <>
            <Button onClick={login} variant="primary" className="w-full">
              {t('universe.account.login')}
            </Button>
            <Button onClick={login} variant="secondary" className="w-full">
              {t('universe.account.create')}
            </Button>
          </>
        )}

        {/* En cours de login */}
        {authAvailable && status === 'loading' && (
          <Button onClick={cancelLogin} variant="secondary" className="w-full">
            {t('universe.account.cancel')}
          </Button>
        )}

        {/* Connecté */}
        {authAvailable && status === 'connected' && (
          <>
            <Button variant="primary" className="w-full">
              {t('universe.account.subscription')}
            </Button>
            <Button onClick={logout} variant="danger" className="w-full">
              {t('universe.account.logout')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}