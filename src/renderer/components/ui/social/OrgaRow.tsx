import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Organisation } from '@stores/social'
import { getSocialErrorMessage } from '@lib/socialErrors'

type Props = {
  orga: Organisation
  onJoin: () => Promise<unknown>
}

/**
 * Organization row: ticker, member count, then a member / application badge, "closed", or a
 * join button (joins open organisations, applies to the others).
 */
export function OrgaRow({ orga, onJoin }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const joinLabel =
    orga.recruitment === 'open'
      ? t('universe.socialPage.joinOrga')
      : t('universe.socialPage.applyOrga')

  const handleJoin = async (): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await onJoin()
      // The store reloads: the row shows the member or application badge
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      {/* Icône orga */}
      <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--color-ds-border)] flex items-center justify-center">
        <OrgaIcon />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-medium text-[var(--color-ds-text)] truncate">
          {orga.name}{' '}
          <span className="text-xs font-normal text-[var(--color-ds-muted)]">[{orga.ticker}]</span>
        </span>
        <span className="text-xs text-[var(--color-ds-muted)]">
          {t('universe.socialPage.orga.members', { count: orga.members })}
        </span>
        {status === 'error' && <span className="text-xs text-red-400 mt-0.5">{errorMsg}</span>}
      </div>

      {/* Badge membre ou bouton rejoindre */}
      {orga.isMember ? (
        <span
          className="
          shrink-0 inline-flex items-center gap-1.5
          px-2.5 py-1 rounded-lg
          border border-[var(--color-ds-accent)]/30
          bg-[var(--color-ds-accent)]/10
          text-[10px] font-semibold text-[var(--color-ds-accent)]
          uppercase tracking-[0.15em]
        "
        >
          <CheckSmallIcon />
          {t('universe.socialPage.orga.memberBadge')}
        </span>
      ) : orga.applicationPending ? (
        <span
          className="
          shrink-0 inline-flex items-center gap-1.5
          px-2.5 py-1 rounded-lg
          border border-[var(--color-ds-border)]
          text-[10px] font-semibold text-[var(--color-ds-muted)]
          uppercase tracking-[0.15em]
        "
        >
          {t('universe.socialPage.orga.applicationBadge')}
        </span>
      ) : orga.recruitment === 'closed' ? (
        <span
          className="
          shrink-0 inline-flex items-center gap-1.5
          px-2.5 py-1 rounded-lg
          border border-[var(--color-ds-border)]
          text-[10px] font-semibold text-[var(--color-ds-muted)]
          uppercase tracking-[0.15em]
        "
        >
          {t('universe.socialPage.orga.closedBadge')}
        </span>
      ) : (
        <button
          onClick={handleJoin}
          disabled={status === 'loading'}
          title={joinLabel}
          aria-label={t('universe.socialPage.orga.joinAria', { name: orga.name })}
          className="
            shrink-0 inline-flex items-center gap-1.5
            px-2.5 py-1 rounded-lg
            border border-[var(--color-ds-border)]
            bg-white/0
            text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.15em]
            hover:border-[var(--color-ds-accent)]/60 hover:text-[var(--color-ds-text)] hover:bg-white/4
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {status === 'loading' ? (
            <>
              <SpinnerIcon />
              <span>...</span>
            </>
          ) : (
            <>
              <JoinIcon />
              <span>{joinLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Inline SVG icons ───────────────────────────────────────────────────────

function OrgaIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 fill-none stroke-[var(--color-ds-muted)] stroke-[1.5]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function JoinIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3 h-3 fill-none stroke-current stroke-[1.8]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

function CheckSmallIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3 h-3 fill-none stroke-current stroke-[2]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  )
}

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3 h-3 fill-none stroke-current stroke-[1.8] animate-spin"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="5.5" strokeOpacity="0.25" />
      <path d="M8 2.5A5.5 5.5 0 0113.5 8" />
    </svg>
  )
}
