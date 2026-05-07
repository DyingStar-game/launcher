import { useEffect, useState } from 'react'
import { useLoreStore } from '@store/lore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const loreMarkdownFiles = import.meta.glob('../../src/content/lore/*.md', {
  query: '?raw',
  import: 'default'
}) as Record<string, () => Promise<string>>

export default function LoreArticle() {
  const { current } = useLoreStore()
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!current) return

    const key = `../../src/content/lore/${current.file}`
    const loader = loreMarkdownFiles[key]

    if (!loader) {
      setContent(`⚠️ Fichier introuvable: ${current.file}`)
      return
    }

    loader().then(setContent)
  }, [current])

  if (!current) {
    return (
      <div className="flex-1 min-w-0 p-6">
        <div className="h-full rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)] flex items-center justify-center text-[var(--color-ds-muted)]">
          Sélectionne un article du lore
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 p-6">
      <div className="h-full overflow-hidden rounded-xl border border-[var(--color-ds-border)] bg-[var(--color-ds-surface)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        <div className="h-full overflow-y-auto px-10 py-8">
          <article className="lore-markdown">

            {/* TITLE (optionnel override) */}
            <h1 className="mb-6">{current.title}</h1>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
            >
              {content}
            </ReactMarkdown>

          </article>
        </div>
      </div>
    </div>
  )
}