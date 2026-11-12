import type React from 'react'

export type ColumnPageLayoutProps = {
  children: React.ReactNode
}

/** Page reading as one centred column, scrolling as a whole (changelog, ADR 0051). */
export default function ColumnPageLayout({ children }: ColumnPageLayoutProps): React.JSX.Element {
  return (
    <div className="size-full min-h-0 flex-auto overflow-y-auto bg-ds-bg">
      <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-2 p-6">{children}</div>
    </div>
  )
}
