export type UniverseLayoutProps = {
  /** The universe itself, over the full-frame background, content at the bottom. */
  hero: React.ReactNode
  /** Fills the hero's frame behind it, decorative (the universe's key art). */
  backdrop?: React.ReactNode
  /** The column on the right (social preview). */
  side: React.ReactNode
  /** Strip above the action bar (e.g. launcher update). */
  banner?: React.ReactNode
  /** Fixed bar at the bottom: the game's state and its main action. */
  actionBar: React.ReactNode
}

/** Universe home: the universe and a side column, then an optional strip and the action bar. */
export default function UniverseLayout({
  hero,
  backdrop,
  side,
  banner,
  actionBar
}: UniverseLayoutProps): React.JSX.Element {
  return (
    <div className="flex size-full min-h-0 flex-auto flex-col bg-ds-bg">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_23.75rem]">
        {/* `mt-auto` rather than `justify-end`, so a hero taller than the frame still scrolls to
            its top */}
        <div className="relative flex min-h-0 flex-col overflow-y-auto bg-ds-surface p-10">
          {backdrop && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              {backdrop}
            </div>
          )}
          <div className="relative mt-auto flex flex-col gap-5">{hero}</div>
        </div>
        <div className="flex min-h-0 flex-col border-l border-ds-border p-6">{side}</div>
      </div>
      {banner}
      {actionBar}
    </div>
  )
}
