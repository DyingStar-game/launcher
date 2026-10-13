import Panel from '@components/atoms/Panel'

export type ListPanelProps = {
  /** The scrolling element, for scroll memory (ADR 0013). */
  ref?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}

/** Framed panel filling the remaining height, its rows scrolling inside. */
export default function ListPanel({ ref, children }: ListPanelProps): React.JSX.Element {
  return (
    <Panel className="flex-1 min-h-0 overflow-hidden">
      <div ref={ref} className="h-full overflow-y-auto p-3 flex flex-col gap-2">
        {children}
      </div>
    </Panel>
  )
}
