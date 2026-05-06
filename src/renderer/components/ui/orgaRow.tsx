export function OrgaRow({ orga }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-ds-surface-hover)]">
      <div>
        <p className="text-sm">{orga.name}</p>
        <p className="text-xs text-[var(--color-ds-muted)]">
          {orga.members} membres
        </p>
      </div>

      <button className="text-xs px-2 py-1 border rounded border-[var(--color-ds-border)]">
        Rejoindre
      </button>
    </div>
  )
}