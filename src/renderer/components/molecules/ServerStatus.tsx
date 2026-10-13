import type { ServerStatusValue } from '@shared/types/game'
import { cn } from '@lib/cn'

export type ServerStatusProps = { status: ServerStatusValue }

const STATUS_CONFIG: Record<ServerStatusValue, { color: string; pulse: boolean }> = {
  online: { color: 'bg-emerald-400', pulse: true },
  degraded: { color: 'bg-amber-400', pulse: true },
  offline: { color: 'bg-red-500', pulse: false },
  maintenance: { color: 'bg-sky-400', pulse: true },
  unknown: { color: 'bg-zinc-500', pulse: false },
  unavailable: { color: 'bg-zinc-600', pulse: false }
}

/** Colored status dot with optional pulse animation for live server state. */
export default function ServerStatus({ status }: ServerStatusProps): React.JSX.Element {
  const { color, pulse } = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown

  return (
    <span className="relative inline-flex size-2.5 shrink-0">
      {pulse && (
        <span
          className={cn(
            'animate-ping absolute inline-flex size-full rounded-full opacity-50',
            color
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full size-2.5', color)} />
    </span>
  )
}
