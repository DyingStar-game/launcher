import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import LabelTooltip from './LabelTooltip'
import ListRow from '@components/atoms/ListRow'

/**
 * `incoming` / `outgoing`: a friend request received or sent; `invitation`: an organisation
 * invited the player; `application`: the player applied to an organisation; `received`: a
 * player applied to an organisation the player recruits for.
 */
export type RequestKind = 'incoming' | 'outgoing' | 'invitation' | 'application' | 'received'

export type RequestRowProps = {
  /** The other party's name, for the buttons' labels. */
  name: string
  /** The other party: `PlayerIdentity` or `OrganisationIdentity`, opening their sheet. */
  identity: React.ReactNode
  /** Received requests can be accepted or declined; sent ones can only be cancelled. */
  kind: RequestKind
  onAccept?: () => Promise<void>
  onDecline: () => Promise<void>
}

/** Translation keys of the decline button and its label, per kind. */
const declineKeys: Record<RequestKind, { label: string; aria: string }> = {
  incoming: {
    label: 'universe.socialPage.decline',
    aria: 'universe.socialPage.request.declineAria'
  },
  outgoing: {
    label: 'universe.socialPage.request.cancel',
    aria: 'universe.socialPage.request.cancelAria'
  },
  invitation: {
    label: 'universe.socialPage.decline',
    aria: 'universe.socialPage.request.invitationDeclineAria'
  },
  application: {
    label: 'universe.socialPage.request.withdraw',
    aria: 'universe.socialPage.request.withdrawAria'
  },
  received: {
    label: 'universe.socialPage.decline',
    aria: 'universe.socialPage.request.applicationDeclineAria'
  }
}

/** Translation keys of the accept button's label, for the kinds that can be accepted. */
const acceptAria: Partial<Record<RequestKind, string>> = {
  incoming: 'universe.socialPage.request.acceptAria',
  invitation: 'universe.socialPage.request.invitationAcceptAria',
  received: 'universe.socialPage.request.applicationAcceptAria'
}

/** Pending request row: accept / decline (received) or cancel / withdraw (sent). */
export default function RequestRow({
  name,
  identity,
  kind,
  onAccept,
  onDecline
}: RequestRowProps): React.JSX.Element {
  const { t } = useTranslation()
  const accept = acceptAria[kind]
  const decline = declineKeys[kind]
  const [status, setStatus] = useState<'idle' | 'accepting' | 'declining' | 'done'>('idle')

  const handleAccept = async (): Promise<void> => {
    if (!onAccept) return
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
    <ListRow>
      {identity}

      {!accept && (
        <span className="shrink-0 text-2xs font-semibold text-ds-muted uppercase tracking-[0.15em]">
          {t('universe.socialPage.request.sent')}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Accepter */}
        {accept && (
          <LabelTooltip label={t('universe.socialPage.accept')}>
            <Button
              variant="success"
              size="icon-sm"
              onClick={handleAccept}
              disabled={busy}
              loading={status === 'accepting'}
              aria-label={t(accept, { name })}
            >
              <CheckIcon />
            </Button>
          </LabelTooltip>
        )}

        {/* Refuser */}
        <LabelTooltip label={t(decline.label)}>
          <Button
            variant="danger"
            size="icon-sm"
            onClick={handleDecline}
            disabled={busy}
            loading={status === 'declining'}
            aria-label={t(decline.aria, { name })}
          >
            <XIcon />
          </Button>
        </LabelTooltip>
      </div>
    </ListRow>
  )
}

// ─── Inline SVG icons ───────────────────────────────────────────────────────

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 fill-none stroke-current stroke-[1.8]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8l3.5 3.5L13 4.5" />
    </svg>
  )
}

function XIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 fill-none stroke-current stroke-[1.8]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}
