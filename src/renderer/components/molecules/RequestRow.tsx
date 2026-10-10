import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FriendRequest } from '@shared/types/social'
import Button from '@components/atoms/Button'
import LabelTooltip from './LabelTooltip'
import PlayerIdentity from './PlayerIdentity'

type Props = {
  req: FriendRequest
  /** Incoming requests can be accepted or declined; outgoing ones can only be cancelled. */
  direction: 'incoming' | 'outgoing'
  /** Opens the player's sheet. */
  onOpen: () => void
  onAccept?: () => Promise<void>
  onDecline: () => Promise<void>
}

/** Friend request row: accept/decline (incoming) or cancel (outgoing). */
export default function RequestRow({
  req,
  direction,
  onOpen,
  onAccept,
  onDecline
}: Props): React.JSX.Element {
  const { t } = useTranslation()
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
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      <PlayerIdentity name={req.name} onOpen={onOpen} />

      {direction === 'outgoing' && (
        <span className="shrink-0 text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.15em]">
          {t('universe.socialPage.request.sent')}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Accepter */}
        {direction === 'incoming' && (
          <LabelTooltip label={t('universe.socialPage.accept')}>
            <Button
              variant="success"
              size="icon-sm"
              onClick={handleAccept}
              disabled={busy}
              loading={status === 'accepting'}
              aria-label={t('universe.socialPage.request.acceptAria', { name: req.name })}
            >
              <CheckIcon />
            </Button>
          </LabelTooltip>
        )}

        {/* Refuser */}
        <LabelTooltip
          label={
            direction === 'incoming'
              ? t('universe.socialPage.decline')
              : t('universe.socialPage.request.cancel')
          }
        >
          <Button
            variant="danger"
            size="icon-sm"
            onClick={handleDecline}
            disabled={busy}
            loading={status === 'declining'}
            aria-label={
              direction === 'incoming'
                ? t('universe.socialPage.request.declineAria', { name: req.name })
                : t('universe.socialPage.request.cancelAria', { name: req.name })
            }
          >
            <XIcon />
          </Button>
        </LabelTooltip>
      </div>
    </div>
  )
}

// ─── Inline SVG icons ───────────────────────────────────────────────────────

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8]"
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
      className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8]"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}
