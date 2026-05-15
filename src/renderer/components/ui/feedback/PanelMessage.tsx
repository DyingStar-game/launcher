import type { ReactNode } from 'react'

type Variant = 'info' | 'warning' | 'error'

type Props = {
  variant: Variant
  children: ReactNode
  className?: string
}

const STYLES: Record<Variant, string> = {
  info:    'border-sky-500/35 bg-sky-500/12 text-sky-100',
  warning: 'border-amber-500/35 bg-amber-500/12 text-amber-100',
  error:   'border-red-500/35 bg-red-500/12 text-red-200'
}

export default function PanelMessage({
  variant,
  children,
  className = ''
}: Props): React.JSX.Element {
  return (
    <div
      role="status"
      className={[
        'rounded-lg border px-3 py-2 text-xs font-medium leading-snug shadow-sm',
        STYLES[variant],
        className
      ].join(' ')}
    >
      {children}
    </div>
  )
}
