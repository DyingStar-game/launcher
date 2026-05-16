import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type Props = {
  open: boolean
  title: string
  loading?: boolean
  loadingLabel: string
  markdown: string | null
  emptyLabel: string
  onClose: () => void
}

/** Modal that displays CHANGELOG.md from the game install directory. */
export default function ChangelogModal({
  open,
  title,
  loading = false,
  loadingLabel,
  markdown,
  emptyLabel,
  onClose
}: Props): React.JSX.Element | null {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="ds-modal max-w-2xl w-full max-h-[min(85vh,720px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--color-ds-border)]">
          <h2
            id="changelog-modal-title"
            className="text-sm font-semibold text-[var(--color-ds-text)]"
          >
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

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-[var(--color-ds-muted)]">{loadingLabel}</p>}
          {!loading && (markdown === null || markdown === '') && (
            <p className="text-sm text-[var(--color-ds-muted)]">{emptyLabel}</p>
          )}
          {!loading && markdown !== null && markdown !== '' && (
            <article className="lore-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
