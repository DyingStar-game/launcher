import { createElement } from 'react'
import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@lib/cn'

const panelVariants = cva('bg-ds-surface border border-ds-border rounded-ds-panel', {
  variants: {
    variant: {
      /** A page's framed area: scrolls inside, its border lights up under the pointer. */
      panel:
        'shadow-ds-panel min-h-0 overflow-y-auto transition-colors duration-150 ' +
        'hover:border-ds-accent/40',
      /** A small block inside a page (figure, inline form). */
      card: 'shadow-ds-card'
    }
  },
  defaultVariants: { variant: 'panel' }
})

export type PanelProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof panelVariants> & {
    ref?: React.Ref<HTMLDivElement>
    /** Draws the panel on its only child (e.g. a `<form>`) instead of a `<div>`. */
    asChild?: boolean
  }

/** Framed surface of the launcher: a page's panel or a card. `className` is for layout only. */
export default function Panel({
  variant,
  asChild = false,
  className,
  ...props
}: PanelProps): React.JSX.Element {
  // createElement: the element is the caller's, the look is the atom's own (ADR 0017)
  return createElement(asChild ? Slot.Root : 'div', {
    className: cn(panelVariants({ variant }), className),
    ...props
  })
}
