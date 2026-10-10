type Props = {
  navbar: React.ReactNode
  /** Current page. */
  children: React.ReactNode
}

/** Application frame: navbar, then the page (ADR 0011). */
export default function AppLayout({ navbar, children }: Props): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden font-sans">
      {navbar}
      <main className="flex min-h-0 flex-1 flex-col bg-[var(--color-ds-bg)]">{children}</main>
    </div>
  )
}
