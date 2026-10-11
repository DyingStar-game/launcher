import { createElement } from 'react'
import type React from 'react'
import { cn } from '@lib/cn'

export type ListRowProps = {
  /** `li` inside a `<ul>`, `div` otherwise. */
  as?: 'div' | 'li'
  /** Layout only (ADR 0017), e.g. a tighter padding in a small panel. */
  className?: string
  children: React.ReactNode
}

/**
 * One row of a list (friends, requests, organisations, members): identity on the left, actions
 * on the right. The whole row lights up under the pointer, so an action at the far end reads as
 * the row's own.
 */
export default function ListRow({
  as = 'div',
  className,
  children
}: ListRowProps): React.JSX.Element {
  // createElement: the tag is chosen by the caller, the look is the atom's own (ADR 0017)
  return createElement(
    as,
    {
      className: cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        'hover:bg-ds-surface-hover focus-within:bg-ds-surface-hover',
        className
      )
    },
    children
  )
}
