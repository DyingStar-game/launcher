import { Toaster } from '@components/ui/sonner'
import { toastDurationMs } from '@lib/env'

export type AppLayoutProps = {
  navbar: React.ReactNode
  /** Second header row, for the chosen universe (ADR 0034). */
  universeBar: React.ReactNode
  /** Current page. */
  children: React.ReactNode
}

/** Application frame: navbar, universe bar, then the page (ADR 0011), and the toasts. */
export default function AppLayout({
  navbar,
  universeBar,
  children
}: AppLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-0 size-full flex-col overflow-hidden font-sans">
      {navbar}
      {universeBar}
      <main className="flex min-h-0 flex-1 flex-col bg-ds-bg">{children}</main>
      <Toaster duration={toastDurationMs()} />
    </div>
  )
}
