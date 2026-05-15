type Props = {
  current: string
  setCurrent: (v: string) => void
}

export default function SocialSidebar({
  current,
  setCurrent
}: Props) {
  const items = ['friends', 'organizations', 'requests']

  return (
    <div className="w-60 shrink-0 border-r border-[var(--color-ds-border)] bg-[var(--color-ds-surface)]/30 backdrop-blur px-3 py-4 flex flex-col gap-2">

      <div className="px-2 pb-2">
        <p className="text-xs font-semibold text-[var(--color-ds-muted)] uppercase tracking-widest">
          Social
        </p>

        <p className="text-[11px] text-[var(--color-ds-muted)]">
          Amis, organisations, demandes.
        </p>
      </div>

      {items.map((item) => (
        <button
          key={item}
          onClick={() => setCurrent(item)}
          className={`
            text-left
            px-3
            py-2.5
            rounded-xl
            text-sm
            border
            capitalize
            transition-colors
            cursor-pointer
            ${
              current === item
                ? `
                  bg-[var(--color-ds-surface)]
                  text-[var(--color-ds-text)]
                  border-[var(--color-ds-accent)]/40
                `
                : `
                  text-[var(--color-ds-muted)]
                  border-transparent
                  hover:border-[var(--color-ds-border)]
                  hover:bg-[var(--color-ds-surface-hover)]
                  hover:text-[var(--color-ds-text)]
                `
            }
          `}
        >
          {item}
        </button>
      ))}
    </div>
  )
}