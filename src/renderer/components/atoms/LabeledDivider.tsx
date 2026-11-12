import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/cn'
import { Separator } from '@components/ui/separator'

const labeledDividerVariants = cva('whitespace-nowrap text-xs', {
  variants: {
    tone: {
      /** Calls for attention: what is new starts here. */
      accent: 'font-semibold text-ds-text',
      neutral: 'font-medium text-ds-subtle'
    }
  },
  defaultVariants: { tone: 'neutral' }
})

export type LabeledDividerProps = VariantProps<typeof labeledDividerVariants> & {
  className?: string
  children: React.ReactNode
}

/** A line across a list, with its label at the start: marks where a part of the list begins. */
export default function LabeledDivider({
  tone,
  className,
  children
}: LabeledDividerProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <p className={labeledDividerVariants({ tone })}>{children}</p>
      <div className="min-w-0 flex-1">
        <Separator />
      </div>
    </div>
  )
}
