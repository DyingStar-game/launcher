import type React from 'react'
import { cn } from '@lib/cn'

export type PageSidebarProps = {
  className?: string
  children: React.ReactNode
}

/** Navigation column on the left of a page (social, changelog), full height. */
export default function PageSidebar({ className, children }: PageSidebarProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex h-full min-h-full w-68 shrink-0 flex-col gap-2 self-stretch px-3 py-4',
        'border-r border-ds-border bg-ds-surface/30 backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  )
}
