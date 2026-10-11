import type React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLoreStore } from '@stores/lore'
import Panel from '@components/atoms/Panel'
import MarkdownArticle from '@components/molecules/MarkdownArticle'

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
        <Panel className="flex h-full flex-1 items-center justify-center">
          <p className="text-ds-muted">{t('lore.selectArticle')}</p>
        </Panel>
      </div>
    )
  }

  const title = t(`lore.articles.${current.id}`, { defaultValue: current.id })
  const body = missingFile ? t('lore.fileNotFound', { file: current.file }) : content

  return (
    <div className="flex min-h-0 flex-1 flex-col min-w-0 p-6">
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="h-full overflow-y-auto px-10 py-8">
          <MarkdownArticle title={title} markdown={body} />
        </div>
      </Panel>
    </div>
  )
}
