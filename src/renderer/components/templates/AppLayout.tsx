export type AppLayoutProps = {
  navbar: React.ReactNode
  /** Current page. */
  children: React.ReactNode
}

/** Application frame: navbar, then the page (ADR 0011). */
export default function AppLayout({ navbar, children }: AppLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-0 size-full flex-col overflow-hidden font-sans">
      {navbar}
      <main className="flex min-h-0 flex-1 flex-col bg-ds-bg">{children}</main>
    </div>
  )
}
