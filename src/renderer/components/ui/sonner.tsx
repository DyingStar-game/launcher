// shadcn/ui (radix-nova, shadcn 4.21.4), owned code (ADR 0016, 0027) with the launcher look
// (ADR 0017): no `next-themes` (the launcher is dark only), colours from the launcher tokens, the
// app font, `app-no-drag` for the frameless window, and placed under the two header rows.
import * as React from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-left"
      // Under the top bar and the universe bar (ADR 0034), where the eye starts reading
      offset={{ top: '8.25rem', left: '1.5rem' }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-ds-success" />,
        info: <InfoIcon className="size-4 text-ds-text" />,
        warning: <TriangleAlertIcon className="size-4 text-ds-warning" />,
        error: <OctagonXIcon className="size-4 text-ds-danger" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      style={
        {
          '--normal-bg': 'var(--color-ds-surface)',
          '--normal-text': 'var(--color-ds-text)',
          '--normal-border': 'var(--color-ds-border)',
          '--border-radius': 'var(--radius-ds-panel)'
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'app-no-drag font-sans text-sm shadow-ds-modal'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
