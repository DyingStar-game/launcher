import { Skeleton } from '@components/ui/skeleton'

export type TextSkeletonProps = {
  /** Number of text lines. */
  lines?: number
}

/** Skeleton of a paragraph (ADR 0018): lines of varying width, the last one shorter. */
export default function TextSkeleton({ lines = 3 }: TextSkeletonProps): React.JSX.Element {
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12']
  return (
    <div aria-hidden="true" className="flex flex-col gap-2.5">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          shape="line"
          className={index === lines - 1 ? 'w-2/3' : widths[index % widths.length]}
        />
      ))}
    </div>
  )
}
