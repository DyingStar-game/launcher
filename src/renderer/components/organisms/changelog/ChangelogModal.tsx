import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import Modal from '@components/molecules/Modal'

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
  if (!open) return null

  return (
    <Modal title={title} onClose={onClose} width="max-w-2xl">
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
    </Modal>
  )
}
