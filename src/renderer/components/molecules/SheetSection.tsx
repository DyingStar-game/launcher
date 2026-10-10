type Props = {
  title: string
  children: React.ReactNode
}

/** Section of a sheet: a label, then its content. */
export default function SheetSection({ title, children }: Props): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="ds-section-label">{title}</h3>
      {children}
    </section>
  )
}
