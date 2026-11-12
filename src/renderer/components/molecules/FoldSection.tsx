import type React from 'react'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@lib/cn'
import Button from '@components/atoms/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible'

const foldSectionVariants = cva('rounded-ds-panel border', {
  variants: {
    /** `apart`: dashed, for what is not part of the list under it. */
    tone: { plain: '', apart: 'border-dashed border-ds-border' },
    open: { true: 'border-ds-border bg-ds-surface', false: '' }
  },
  compoundVariants: [{ tone: 'plain', open: false, className: 'border-transparent' }],
  defaultVariants: { tone: 'plain', open: false }
})

export type FoldSectionProps = Pick<VariantProps<typeof foldSectionVariants>, 'tone'> & {
  heading: string
  /** Next to the title: how much it holds, its date. */
  meta: string
  /** At the end of the line, once folded: what it is about. */
  summary?: string
  /** Next to the meta, open or folded: a badge. */
  aside?: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

/** A titled block of a long list, folded on one line; its content is only mounted once open. */
export default function FoldSection({
  heading,
  meta,
  summary,
  aside,
  tone,
  open,
  onOpenChange,
  children
}: FoldSectionProps): React.JSX.Element {
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(foldSectionVariants({ tone, open }))}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="none"
          className="w-full justify-start gap-2.5 px-3.5 py-2.5 text-left"
        >
          <span className="text-ds-subtle">
            <Chevron className="size-4" aria-hidden="true" />
          </span>
          <span className="font-semibold text-ds-body">{heading}</span>
          <span className="text-xs whitespace-nowrap text-ds-subtle tabular-nums">{meta}</span>
          {aside}
          {!open && summary && (
            <span className="ml-auto min-w-0 truncate text-xs text-ds-subtle">{summary}</span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 pt-1 pr-4.5 pb-4 pl-10">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
