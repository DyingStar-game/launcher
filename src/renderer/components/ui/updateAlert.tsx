type Variant = 'launcher' | 'game'

type Props = {
  variant: Variant
  currentVersion?: string
  latestVersion: string
  onDismiss?: () => void
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
    text:    'text-amber-200/70',
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

export default function UpdateAlert({ variant, currentVersion, latestVersion, onDismiss }: Props): React.JSX.Element {
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
        <span className={`text-[11px] ${cls.text}`}>
          {currentVersion
            ? `Version actuelle : ${currentVersion} → `
            : ''}
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono font-semibold ${cls.badge}`}>
            v{latestVersion}
          </span>
          {variant === 'launcher' && (
            <span className="ml-1">Relancez le launcher pour l'installer.</span>
          )}
        </span>
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