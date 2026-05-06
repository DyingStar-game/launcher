export function RequestRow({ req }) {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)]">
  
        <span className="text-sm">{req.name}</span>
  
        <div className="flex gap-2">
          <button className="text-green-400 text-xs">✔</button>
          <button className="text-red-400 text-xs">✖</button>
        </div>
      </div>
    )
  }