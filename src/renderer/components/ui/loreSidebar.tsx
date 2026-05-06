import { useLoreStore } from '@store/lore'

export default function LoreSidebar() {
  const { articles, current, select } = useLoreStore()

  return (
    <div className="w-56 border-r border-[var(--color-ds-border)] p-2 flex flex-col gap-1">

      {articles.map((a) => (
        <button
          key={a.id}
          onClick={() => select(a.id)}
          className={`text-left px-3 py-2 rounded-lg text-sm ${
            current?.id === a.id
              ? 'bg-[var(--color-ds-surface-hover)] text-white'
              : 'text-[var(--color-ds-muted)] hover:text-white'
          }`}
        >
          {a.title}
        </button>
      ))}

    </div>
  )
}