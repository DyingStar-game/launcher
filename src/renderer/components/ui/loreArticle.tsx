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
      <div className="flex items-center justify-center h-full text-[var(--color-ds-muted)]">
        Sélectionne un article du lore
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
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
  )
}