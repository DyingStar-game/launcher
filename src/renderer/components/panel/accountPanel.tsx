import { useAccountStore } from '@store/account'
import { useTranslation } from 'react-i18next'

export default function AccountPanel(): React.JSX.Element {
  const { status, username, login, logout } = useAccountStore()
  const { t } = useTranslation()

  return (
    <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-4">

      {/* Title */}
      <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
        {t('universe.account.title')}
      </h2>

      {/* Status */}
      {status === 'disconnected' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.disconnected')}
        </p>
      )}

      {status === 'loading' && (
        <p className="text-[var(--color-ds-muted)] text-sm">
          {t('universe.account.loading')}
        </p>
      )}

      {status === 'connected' && (
        <p className="text-[var(--color-ds-text)] text-sm">
          {t('universe.account.connectedAs', { username })}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">

        {status === 'disconnected' && (
          <>
            <button
              onClick={login}
              className="px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t('universe.account.login')}
            </button>

            <button
              className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
            >
              {t('universe.account.create')}
            </button>
          </>
        )}

        {status === 'connected' && (
          <>
            <button
              className="px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t('universe.account.subscription')}
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-red-400 hover:border-red-400 transition-colors cursor-pointer"
            >
              {t('universe.account.logout')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}