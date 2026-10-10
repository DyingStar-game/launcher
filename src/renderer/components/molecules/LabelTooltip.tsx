import { useRef, useState, type ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip'

type Props = {
  /** Text of the tooltip (the trigger keeps its own `aria-label`). */
  label: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** The trigger: a single element accepting a ref, e.g. a `Button`. */
  children: ReactElement
}

const DELAY_MS = 300

/**
 * Tooltip on hover or keyboard focus (Radix, ADR 0016), replacing native `title` attributes.
 * Focus given back by a menu after a mouse selection is not keyboard focus (`:focus-visible`):
 * it does not open the tooltip, which would otherwise stay open until the next click.
 */
export default function LabelTooltip({
  label,
  side = 'bottom',
  children
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const hoveredRef = useRef(false)

  const handleOpenChange = (next: boolean): void => {
    const keyboardFocus = document.activeElement?.matches(':focus-visible') ?? false
    if (next && !hoveredRef.current && !keyboardFocus) return
    setOpen(next)
  }

  return (
    <TooltipProvider delayDuration={DELAY_MS}>
      <Tooltip open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger
          asChild
          onPointerEnter={() => (hoveredRef.current = true)}
          onPointerLeave={() => (hoveredRef.current = false)}
          // A click ends the hover: a menu opened by it blocks the pointer, so no leave event
          // would come before it gives the focus back
          onPointerDown={() => (hoveredRef.current = false)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={6}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
