// shadcn/ui (radix-nova, shadcn 4.21.4), owned code (ADR 0016, 0027) with the launcher look
// (ADR 0017): `cn` from @lib/cn, a thicker track on the launcher border colour.
import * as React from 'react'
import { cn } from '@lib/cn'
import { Progress as ProgressPrimitive } from 'radix-ui'

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        'relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-ds-border',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all duration-300"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
