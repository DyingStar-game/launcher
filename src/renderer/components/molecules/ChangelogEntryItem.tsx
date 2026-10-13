import type React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

/** The look of each markdown element of a bullet, in Tailwind classes (ADR 0032). */
const components: Components = {
  p: ({ children }) => <span>{children}</span>,
  a: ({ href, children }) => (
    <a href={href} className="text-ds-accent underline">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded-md bg-ds-surface-hover px-1.5 py-0.5 text-[0.9em]">{children}</code>
  )
}

export type ChangelogEntryItemProps = {
  text: string
}

/** Renders one changelog bullet with markdown and indented continuation lines. */
export default function ChangelogEntryItem({ text }: ChangelogEntryItemProps): React.JSX.Element {
  const lines = text.replace(/\\n/g, '\n').split('\n')

  return (
    // Inline: the first line sits next to the list bullet
    <span className="inline text-left">
      {lines.map((line, index) => (
        <span key={index} className={index > 0 ? 'block pl-4 text-ds-muted' : 'block'}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={components}
          >
            {line}
          </ReactMarkdown>
        </span>
      ))}
    </span>
  )
}
