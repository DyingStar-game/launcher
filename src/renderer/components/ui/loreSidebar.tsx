import { useLoreStore } from '@store/lore'

export default function LoreSidebar() {
  const { articles, current, select } = useLoreStore()

  return (
    <div className="w-60 shrink-0 border-r border-[var(--color-ds-border)] bg-[var(--color-ds-surface)]/30 backdrop-blur px-3 py-4 flex flex-col gap-2">
      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          Lore
        </p>
        <p className="text-[11px] text-[var(--color-ds-muted)]">
          Articles, chroniques, archives.
        </p>
      </div>

      {articles.map((a) => (
        <button
          key={a.id}
          onClick={() => select(a.id)}
          className={`text-left px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer ${
            current?.id === a.id
              ? 'bg-[var(--color-ds-surface)] text-[var(--color-ds-text)] border-[var(--color-ds-accent)]/40'
              : 'text-[var(--color-ds-muted)] border-transparent hover:border-[var(--color-ds-border)] hover:bg-[var(--color-ds-surface-hover)] hover:text-[var(--color-ds-text)]'
          }`}
        >
          {a.title}
        </button>
      ))}

    </div>
  )
}