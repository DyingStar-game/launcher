import type { FriendStatus } from '@shared/types/social'
import { Badge } from '@components/ui/badge'
import { cn } from '@lib/cn'
import { PRESENCE_COLOR, PRESENCE_HALO } from '@lib/presence'

type Props = {
  status: FriendStatus
  /** Translated label: "Online", "In mission • Tarsis"… */
  label: string
}

/** A player's presence: shadcn's Badge with the avatar's presence colour, glowing when online. */
export default function PresenceBadge({ status, label }: Props): React.JSX.Element {
  return (
    <Badge variant="outline" data-status={status}>
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 rounded-full',
          PRESENCE_COLOR[status],
          PRESENCE_HALO[status],
          status !== 'offline' && 'animate-pulse'
        )}
      />
      {label}
    </Badge>
  )
}
