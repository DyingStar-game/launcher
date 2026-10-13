import { createElement } from 'react'
import type React from 'react'
import { cn } from '@lib/cn'

export type SectionLabelProps = {
  /** Heading level in the page, or a plain paragraph for a list's group label. */
  as?: 'h2' | 'h3' | 'p'
  className?: string
  children: React.ReactNode
}

/** Small uppercase label heading a panel, a sheet section or a group of rows. */
export default function SectionLabel({
  as = 'p',
  className,
  children
}: SectionLabelProps): React.JSX.Element {
  // createElement: the tag is chosen by the caller, the look is the atom's own (ADR 0017)
  return createElement(
    as,
    {
      className: cn('text-xs font-semibold uppercase tracking-[0.24em] text-ds-muted', className)
    },
    children
  )
}
