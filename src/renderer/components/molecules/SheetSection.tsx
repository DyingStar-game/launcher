import SectionLabel from '@components/atoms/SectionLabel'

export type SheetSectionProps = {
  title: string
  children: React.ReactNode
}

/** Section of a sheet: a label, then its content. */
export default function SheetSection({ title, children }: SheetSectionProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel as="h3">{title}</SectionLabel>
      {children}
    </section>
  )
}
