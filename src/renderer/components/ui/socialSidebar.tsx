type Props = {
    current: string
    setCurrent: (v: string) => void
  }
  
  export default function SocialSidebar({ current, setCurrent }: Props) {
    const items = ['friends', 'organizations', 'requests']
  
    return (
      <div className="w-48 border-r border-[var(--color-ds-border)] p-2 flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => setCurrent(item)}
            className={`text-left px-3 py-2 rounded-lg text-sm capitalize ${
              current === item
                ? 'bg-[var(--color-ds-surface-hover)] text-[var(--color-ds-text)]'
                : 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    )
  }