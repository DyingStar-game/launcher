import { useNavigationStore } from '@store/navigation'

export default function Universe(): React.JSX.Element {
  const { navigate } = useNavigationStore()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">

      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--color-ds-text)] mb-2">
          Universe
        </h1>
        <p className="text-[var(--color-ds-muted)] text-sm">
          Environnement de production
        </p>
      </div>

      {/* Placeholder zones — seront remplacées par les vraies sections */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">

        {/* Zone compte */}
        <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
            Compte
          </h2>
          <p className="text-[var(--color-ds-muted)] text-sm">Non connecté</p>
          <button className="mt-auto px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            Se connecter
          </button>
        </div>

        {/* Zone jeu */}
        <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
            Jeu
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-ds-success)]" />
            <span className="text-sm text-[var(--color-ds-text)]">Serveurs disponibles</span>
          </div>
          <p className="text-[var(--color-ds-muted)] text-sm">v0.0.0 — Non installé</p>
          <button className="mt-auto px-4 py-2 rounded-lg bg-[var(--color-ds-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            Installer
          </button>
        </div>

        {/* Zone social */}
        <div className="bg-[var(--color-ds-surface)] border border-[var(--color-ds-border)] rounded-xl p-6 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
            Social
          </h2>
          <p className="text-[var(--color-ds-muted)] text-sm">Aucun ami en ligne</p>
          <button
            onClick={() => navigate('social')}
            className="mt-auto px-4 py-2 rounded-lg border border-[var(--color-ds-border)] text-[var(--color-ds-muted)] text-sm hover:text-[var(--color-ds-text)] hover:border-[var(--color-ds-accent)] transition-colors cursor-pointer"
          >
            Voir tout →
          </button>
        </div>
      </div>

    </div>
  )
}