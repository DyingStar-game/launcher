import { cn } from '@lib/cn'

export type DetailPageLayoutProps = {
  /** Back button (or nothing). */
  back?: React.ReactNode
  /** Identity block: avatar, name, status, action. */
  header: React.ReactNode
  /** Row of figures under the header. */
  stats?: React.ReactNode
  /** Wide column: the main content. */
  main?: React.ReactNode
  /** Narrow column: related things. */
  aside?: React.ReactNode
  /** Shown instead of the body (loading, error). */
  placeholder?: React.ReactNode
  /** Ref of the scrolling container, for scroll memory (ADR 0013). */
  scrollRef?: React.Ref<HTMLDivElement>
}

/** Detail page (ADR 0012): back, header, stats, then a main and an aside column; scrolls. */
export default function DetailPageLayout({
  back,
  header,
  stats,
  main,
  aside,
  placeholder,
  scrollRef
}: DetailPageLayoutProps): React.JSX.Element {
  return (
    <div ref={scrollRef} className="flex size-full min-h-0 flex-auto bg-ds-bg overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        {back && <div>{back}</div>}
        {placeholder ?? (
          <>
            {header}
            {stats}
            {/* Without an aside (edit and management pages), the main column takes the width */}
            <div
              className={cn(
                'grid grid-cols-1 gap-6',
                aside && 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'
              )}
            >
              <div className="flex min-w-0 flex-col gap-6">{main}</div>
              {aside && <div className="flex min-w-0 flex-col gap-6">{aside}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
