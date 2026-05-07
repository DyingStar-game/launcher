import { useAccountStore } from '@store/account'
import { useTranslation } from 'react-i18next'
import Button from '@components/ui/button'

export default function AccountPanel(): React.JSX.Element {
  const { status, username, login, logout } = useAccountStore()
  const { t } = useTranslation()

  return (
    <div className="border-box h-full bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-7 flex flex-col gap-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[var(--color-ds-accent)]/40 transition-colors">

      <div className="flex items-center gap-3">
        <h2 className="text-[11px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.24em]">
          {t('universe.account.title')}
        </h2>
        <div className="h-px flex-1 bg-[var(--color-ds-border)]" />
      </div>

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
            <Button
              onClick={login}
              variant="primary"
              className="w-full"
            >
              {t('universe.account.login')}
            </Button>

            <Button variant="secondary" className="w-full">
              {t('universe.account.create')}
            </Button>
          </>
        )}

        {status === 'connected' && (
          <>
            <Button variant="primary" className="w-full">
              {t('universe.account.subscription')}
            </Button>

            <Button
              onClick={logout}
              variant="danger"
              className="w-full"
            >
              {t('universe.account.logout')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}