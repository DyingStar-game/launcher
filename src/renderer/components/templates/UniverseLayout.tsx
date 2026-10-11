export type UniverseLayoutProps = {
  /** Strip across the top (e.g. the testing environment banner). */
  banner?: React.ReactNode
  /** Alert under the banner (e.g. launcher update). */
  alert?: React.ReactNode
  /** The four panels, filled row by row in a 2 × 2 grid. */
  panels: [React.ReactNode, React.ReactNode, React.ReactNode, React.ReactNode]
}

/** Universe home: optional banner and alert, then a 2 × 2 grid of panels. */
export default function UniverseLayout({
  banner,
  alert,
  panels
}: UniverseLayoutProps): React.JSX.Element {
  return (
    <div className="flex size-full min-h-0 flex-auto bg-ds-bg flex-col">
      {banner}
      {alert && <div className="shrink-0 px-4 pt-3">{alert}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4 p-4">{panels}</div>
    </div>
  )
}
