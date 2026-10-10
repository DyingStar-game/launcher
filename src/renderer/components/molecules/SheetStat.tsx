type Props = {
  label: string
  value: React.ReactNode
}

/** Labelled figure in a sheet's stats row (inside a `<dl>`). */
export default function SheetStat({ label, value }: Props): React.JSX.Element {
  return (
    <div className="ds-card flex flex-col gap-1 p-3">
      <dt className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-[var(--color-ds-text)]">{value}</dd>
    </div>
  )
}
