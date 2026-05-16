import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoreStore } from '@stores/lore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const loreMarkdownFiles = import.meta.glob('../../../content/lore/*.md', {
  query: '?raw',
  import: 'default'
}) as Record<string, () => Promise<string>>

/** Loads and renders the selected lore markdown article via Vite glob imports. */
export default function LoreArticle(): React.JSX.Element {
  const { t } = useTranslation()
  const { current } = useLoreStore()
  const [content, setContent] = useState('')

  const articleKey = current ? `../../../content/lore/${current.file}` : null
  const loader = articleKey ? loreMarkdownFiles[articleKey] : undefined
  const missingFile = Boolean(current && articleKey && !loader)

  useEffect(() => {
    if (!current || !loader) return

    let cancelled = false
    void loader().then((markdown) => {
      if (!cancelled) setContent(markdown)
    })
    return () => {
      cancelled = true
    }
  }, [current, loader])

  if (!current) {
    return (
      <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
        <div className="ds-panel flex h-full flex-1 items-center justify-center text-[var(--color-ds-muted)]">
          {t('lore.selectArticle')}
        </div>
      </div>
    )
  }

  const title = t(`lore.articles.${current.id}`, { defaultValue: current.id })
  const body = missingFile ? t('lore.fileNotFound', { file: current.file }) : content

  return (
    <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
      <div className="ds-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full overflow-y-auto px-10 py-8">
          <article className="lore-markdown">
            <h1 className="mb-6">{title}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
              {body}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  )
}
