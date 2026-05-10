type Variant = 'launcher' | 'game'

type Props = {
  variant:            Variant
  currentVersion?:    string
  latestVersion:      string
  latestReleaseDate?: string
  onDismiss?:         () => void
}

const CONFIG = {
  launcher: {
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4 fill-none stroke-current stroke-[1.5] shrink-0" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1v8M5 6l3 3 3-3" />
        <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" />
      </svg>
    ),
    color: 'amber',
    label: 'Mise à jour du launcher disponible'
  },
  game: {
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4 fill-none stroke-current stroke-[1.5] shrink-0" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v3.5l2 1.5" />
      </svg>
    ),
    color: 'sky',
    label: 'Nouvelle version du jeu disponible'
  }
} as const

const COLOR_CLASSES = {
  amber: {
    wrapper: 'border-amber-500/30 bg-amber-500/8',
    icon:    'text-amber-400',
    title:   'text-amber-300',
    text:    'text-sky-200/70',
    badge:   'border-amber-500/30 bg-amber-500/15 text-amber-300',
    dismiss: 'text-amber-400/50 hover:text-amber-300'
  },
  sky: {
    wrapper: 'border-sky-500/30 bg-sky-500/8',
    icon:    'text-sky-400',
    title:   'text-sky-300',
    text:    'text-sky-200/70',
    badge:   'border-sky-500/30 bg-sky-500/15 text-sky-300',
    dismiss: 'text-sky-400/50 hover:text-sky-300'
  }
}

/**
 * Formate un timestamp YYYYMMDDHHMMSS en "10/05/2026 09:29"
 * Laisse passer les autres formats tels quels (semver, etc.)
 */
function formatVersion(v: string): string {
  if (v.length === 14 && /^\d+$/.test(v)) {
    const date = `${v.slice(6, 8)}/${v.slice(4, 6)}/${v.slice(0, 4)}`
    const time = `${v.slice(8, 10)}:${v.slice(10, 12)}`
    return `${date} ${time}`
  }
  return v
}

export default function UpdateAlert({
  variant,
  currentVersion,
  latestVersion,
  latestReleaseDate,
  onDismiss
}: Props): React.JSX.Element {
  const cfg = CONFIG[variant]
  const cls = COLOR_CLASSES[cfg.color]

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cls.wrapper} transition-all`}>

      {/* Icône */}
      <span className={cls.icon}>{cfg.icon}</span>

      {/* Texte */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className={`text-xs font-semibold ${cls.title}`}>
          {cfg.label}
        </span>

        <div className={`flex flex-wrap items-center gap-1.5 text-[11px] ${cls.text}`}>
          {currentVersion && (
            <span className="font-mono opacity-60">{formatVersion(currentVersion)}</span>
          )}
          {currentVersion && <span>→</span>}
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-mono font-semibold text-[10px] ${cls.badge}`}>
            {formatVersion(latestVersion)}
          </span>
          {latestReleaseDate && (
            <span className="opacity-60">· Sortie le {latestReleaseDate}</span>
          )}
          {variant === 'launcher' && (
            <span>· Relancez le launcher pour l'installer.</span>
          )}
        </div>
      </div>

      {/* Fermer (optionnel) */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fermer l'alerte"
          className={`shrink-0 transition-colors ${cls.dismiss}`}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  )
}