import { useEffect, useId } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  title: string
  onClose: () => void
  /** Width class of the panel. */
  width?: 'max-w-xl' | 'max-w-2xl'
  children: React.ReactNode
}

/** Modal frame: dimmed backdrop, titled panel; closed by Escape, a click outside or ✕. */
export default function Modal({
  title,
  onClose,
  width = 'max-w-xl',
  children
}: Props): React.JSX.Element {
  const { t } = useTranslation()
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`ds-modal ${width} w-full max-h-[min(85vh,720px)] flex flex-col`}>
        <header className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--color-ds-border)]">
          <h2 id={titleId} className="text-sm font-semibold text-[var(--color-ds-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="shrink-0 rounded-lg p-1.5 text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-[var(--color-ds-border)]/40 transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-4 h-4 fill-none stroke-current stroke-[1.8]"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
