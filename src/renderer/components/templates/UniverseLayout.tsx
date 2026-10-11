export type UniverseLayoutProps = {
  /** Alert across the top (e.g. launcher update). */
  alert?: React.ReactNode
  /** The left column's two panels, top then bottom. */
  panels: [React.ReactNode, React.ReactNode]
  /** The right column's panel, the whole height. */
  side: React.ReactNode
}

/** Universe home: optional alert, then two stacked panels and one full-height panel. */
export default function UniverseLayout({
  alert,
  panels,
  side
}: UniverseLayoutProps): React.JSX.Element {
  return (
    <div className="flex size-full min-h-0 flex-auto bg-ds-bg flex-col">
      {alert && <div className="shrink-0 px-4 pt-3">{alert}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4 p-4">
        <div className="col-start-1 row-start-1 min-h-0">{panels[0]}</div>
        <div className="col-start-1 row-start-2 min-h-0">{panels[1]}</div>
        <div className="col-start-2 row-span-2 row-start-1 min-h-0">{side}</div>
      </div>
    </div>
  )
}
