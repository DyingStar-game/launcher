import Panel from '@components/atoms/Panel'

export type SheetStatProps = {
  label: string
  value: React.ReactNode
}

/** Labelled figure in a sheet's stats row (inside a `<dl>`). */
export default function SheetStat({ label, value }: SheetStatProps): React.JSX.Element {
  return (
    <Panel variant="card" className="flex flex-col gap-1 p-3">
      <dt className="text-2xs font-semibold text-ds-muted uppercase tracking-[0.2em]">{label}</dt>
      <dd className="text-sm font-semibold text-ds-text">{value}</dd>
    </Panel>
  )
}
