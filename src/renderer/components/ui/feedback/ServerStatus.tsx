import type { ServerStatusValue } from '@stores/game'

type Props = { status: ServerStatusValue }

const STATUS_CONFIG: Record<ServerStatusValue, { color: string; pulse: boolean }> = {
  online: { color: 'bg-emerald-400', pulse: true },
  degraded: { color: 'bg-amber-400', pulse: true },
  offline: { color: 'bg-red-500', pulse: false },
  maintenance: { color: 'bg-sky-400', pulse: true },
  unknown: { color: 'bg-zinc-500', pulse: false },
  unavailable: { color: 'bg-zinc-600', pulse: false }
}

/** Colored status dot with optional pulse animation for live server state. */
export default function ServerStatus({ status }: Props): React.JSX.Element {
  const { color, pulse } = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown

  return (
    <span className="relative inline-flex w-2.5 h-2.5 shrink-0">
      {pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`}
        />
      )}
      <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${color}`} />
    </span>
  )
}
