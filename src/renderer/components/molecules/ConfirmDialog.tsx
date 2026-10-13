import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@components/ui/alert-dialog'
import { getSocialErrorMessage } from '@lib/socialErrors'

export type ConfirmDialogProps = {
  /** The button opening the dialog. */
  trigger: React.ReactElement
  title: string
  description: string
  confirmLabel: string
  /** Runs the action; the dialog stays open, its button spinning, until it answers. */
  onConfirm: () => Promise<unknown>
  /** Extra content between the text and the buttons (e.g. a field to type the tag). */
  children?: React.ReactNode
  /** Keeps the confirm button disabled (e.g. until the tag is typed). */
  confirmDisabled?: boolean
}

/**
 * Asks before a destructive action (ADR 0021): shadcn's AlertDialog (Radix). The action runs from
 * the confirm button; a refusal shows in the dialog, which stays open.
 */
export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
  confirmDisabled = false
}: ConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const changeOpen = (next: boolean): void => {
    if (pending) return
    setOpen(next)
    setError('')
  }

  const confirm = async (): Promise<void> => {
    setPending(true)
    setError('')
    try {
      await onConfirm()
      setOpen(false)
    } catch (err) {
      setError(getSocialErrorMessage(err, t))
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary" disabled={pending}>
              {t('common.cancel')}
            </Button>
          </AlertDialogCancel>
          <Button
            variant="danger"
            loading={pending}
            disabled={confirmDisabled}
            onClick={() => void confirm()}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
