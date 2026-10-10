type Props = {
  title: string
  subtitle?: string
  /** Buttons on the right. */
  actions?: React.ReactNode
}

/** Page title, subtitle and actions, at the top of a page's content column. */
export default function PageHeader({ title, subtitle, actions }: Props): React.JSX.Element {
  return (
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-[var(--color-ds-text)]">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--color-ds-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
