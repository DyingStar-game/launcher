import type React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const H1_CLASS = 'mt-8 mb-4 text-[2.4rem] font-extrabold tracking-[-0.02em]'

/** The look of each element of the markdown, in Tailwind classes (ADR 0032). */
const components: Components = {
  h1: ({ children }) => <h1 className={H1_CLASS}>{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-8 mb-[0.8rem] text-[1.6rem] font-bold text-ds-text">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-[0.6rem] text-[1.2rem] font-semibold text-ds-muted">{children}</h3>
  ),
  p: ({ children }) => <p className="my-[0.8rem] text-ds-text">{children}</p>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-lg border-l-3 border-ds-accent bg-ds-surface-elevated px-4 py-[0.8rem] text-ds-muted italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="my-4 pl-6">{children}</ul>,
  li: ({ children }) => <li className="my-[0.4rem]">{children}</li>,
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="my-6 w-full rounded-xl shadow-ds-panel" />
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-ds-surface-hover px-1.5 py-0.5 text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-xl bg-black/40 p-4">{children}</pre>
  )
}

export type MarkdownArticleProps = {
  title: string
  /** Markdown body; raw HTML is allowed, then sanitised. */
  markdown: string
}

/** A titled article written in markdown (lore), centred and set for reading. */
export default function MarkdownArticle({
  title,
  markdown
}: MarkdownArticleProps): React.JSX.Element {
  return (
    <article className="mx-auto max-w-[53.125rem] text-[0.9375rem] leading-[1.75] text-ds-text">
      <h1 className={H1_CLASS}>{title}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
