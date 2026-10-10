// shadcn/ui Skeleton (shadcn 4.21.4), owned code (ADR 0016) with the launcher look (ADR 0017) and
// a `shape` variant (ADR 0018); callers set its size only. Decorative: hidden from assistive tech.
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/cn'

const skeletonVariants = cva('animate-pulse bg-border/70', {
  variants: {
    shape: {
      line: 'h-3 rounded-full',
      circle: 'rounded-full',
      square: 'rounded-xl',
      block: 'rounded-lg'
    }
  },
  defaultVariants: { shape: 'block' }
})

function Skeleton({
  className,
  shape,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  )
}

export { Skeleton }
