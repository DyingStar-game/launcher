import { useTranslation } from 'react-i18next'
import { ExternalLinkIcon } from 'lucide-react'
import type { ServerStatusValue } from '@shared/types/game'
import ServerStatus from '@components/molecules/ServerStatus'
import LabelTooltip from '@components/molecules/LabelTooltip'

export type ServerStatusLinkProps = {
  status: ServerStatusValue
  /** Players online, shown while the server answers. */
  players: number
  /** The status page; without it the status is plain text. */
  href?: string
}

/** Server status opening the status page, with the number of players online under it. */
export default function ServerStatusLink({
  status,
  players,
  href
}: ServerStatusLinkProps): React.JSX.Element {
  const { t } = useTranslation()
  const label = (
    <>
      <ServerStatus status={status} />
      {t(`universe.game.status.${status}`)}
    </>
  )
  const answering = status === 'online' || status === 'degraded'

  return (
    <div className="flex min-w-50 flex-col gap-1">
      {href ? (
        <LabelTooltip label={t('universe.server.openStatus')} side="top">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-sm text-sm text-ds-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {label}
            <span className="inline-flex text-ds-muted">
              <ExternalLinkIcon className="size-3" aria-hidden="true" />
            </span>
          </a>
        </LabelTooltip>
      ) : (
        <span className="inline-flex items-center gap-2 text-sm text-ds-text">{label}</span>
      )}
      <span className="text-sm text-ds-muted">
        {answering
          ? t('universe.game.players', { count: players })
          : t('universe.server.playersUnknown')}
      </span>
    </div>
  )
}
