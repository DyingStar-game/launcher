import { useState } from 'react'
import type { FriendRequest } from '@stores/social'

type Props = {
  req: FriendRequest
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}

export function RequestRow({ req, onAccept, onDecline }: Props): React.JSX.Element {
  const [status, setStatus] = useState<'idle' | 'accepting' | 'declining' | 'done'>('idle')

  const handleAccept = async (): Promise<void> => {
    setStatus('accepting')
    try {
      await onAccept()
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  const handleDecline = async (): Promise<void> => {
    setStatus('declining')
    try {
      await onDecline()
      setStatus('done')
    } catch {
      setStatus('idle')
    }
  }

  const busy = status === 'accepting' || status === 'declining'

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">

      {/* Avatar placeholder */}
      <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-ds-border)] flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--color-ds-muted)] select-none uppercase">
          {req.name[0]}
        </span>
      </div>

      {/* Nom */}
      <span className="flex-1 min-w-0 text-sm font-medium text-[var(--color-ds-text)] truncate">
        {req.name}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Accepter */}
        <button
          onClick={handleAccept}
          disabled={busy}
          title="Accepter"
          aria-label={`Accepter la demande de ${req.name}`}
          className="
            inline-flex items-center justify-center w-7 h-7 rounded-lg
            border border-emerald-500/30 bg-emerald-500/10
            text-emerald-400
            hover:bg-emerald-500/20 hover:border-emerald-500/60
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {status === 'accepting' ? (
            <SpinnerIcon />
          ) : (
            <CheckIcon />
          )}
        </button>

        {/* Refuser */}
        <button
          onClick={handleDecline}
          disabled={busy}
          title="Refuser"
          aria-label={`Refuser la demande de ${req.name}`}
          className="
            inline-flex items-center justify-center w-7 h-7 rounded-lg
            border border-red-500/30 bg-red-500/10
            text-red-400
            hover:bg-red-500/20 hover:border-red-500/60
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {status === 'declining' ? (
            <SpinnerIcon />
          ) : (
            <XIcon />
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

function CheckIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  )
}

function XIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8] animate-spin" strokeLinecap="round">
      <circle cx="8" cy="8" r="5.5" strokeOpacity="0.25" />
      <path d="M8 2.5A5.5 5.5 0 0113.5 8" />
    </svg>
  )
}