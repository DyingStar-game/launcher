import { Progress } from '@components/ui/progress'
import { cn } from '@lib/cn'

export type GameStateSummaryProps = {
  /** Where the game stands (ready, update required, installing…). */
  heading: string
  /** Why, or what comes with it (version, folder, progress details). */
  detail: string
  /** Install or update progress in percent, while it runs or is paused. */
  progress?: number
  /** Buttons acting on what is shown, at the end of the detail line (cancel a download). */
  actions?: React.ReactNode
}

/**
 * The game's state in the home action bar: a heading, a detail line ending with the buttons acting
 * on it, and the progress under them while installing.
 */
export default function GameStateSummary({
  heading,
  detail,
  progress,
  actions
}: GameStateSummaryProps): React.JSX.Element {
  const withProgress = progress !== undefined

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="truncate text-lg font-semibold text-ds-text">{heading}</span>
      {/* As wide as the progress, so the buttons end right above its end; laid over the line and
          level with its bottom, they keep the text's spacing to the progress and do not push it down */}
      <div className={cn('relative flex min-w-0 items-center', withProgress && 'max-w-160')}>
        <span className={cn('min-w-0 flex-1 truncate text-sm text-ds-muted', actions && 'pr-12')}>
          {detail}
        </span>
        {actions && <div className="absolute right-0 bottom-0 flex gap-2">{actions}</div>}
      </div>
      {withProgress && (
        <Progress value={progress} aria-label={heading} className="mt-1 max-w-160" />
      )}
    </div>
  )
}
