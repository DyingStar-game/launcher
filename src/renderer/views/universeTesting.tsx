export default function UniverseTesting(): React.JSX.Element {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-4xl font-bold text-[var(--color-ds-text)]">
          Universe Testing
        </h1>
        <p className="text-[var(--color-ds-muted)] text-sm">
          Environnement de pré-production — même structure qu'Universe
        </p>
        <div className="px-3 py-1 rounded-full bg-[var(--color-ds-warning)]/20 text-[var(--color-ds-warning)] text-xs font-medium">
          PRE-PROD
        </div>
      </div>
    )
  }