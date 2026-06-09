import type React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

type Props = {
  text: string
}

/** Renders one changelog bullet with markdown and indented continuation lines. */
export default function ChangelogEntryItem({ text }: Props): React.JSX.Element {
  const lines = text.replace(/\\n/g, '\n').split('\n')

  return (
    <span className="block text-left">
      {lines.map((line, index) => (
        <span
          key={index}
          className={index > 0 ? 'block pl-4 text-[var(--color-ds-muted)]' : 'block'}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => <span>{children}</span>
            }}
          >
            {line}
          </ReactMarkdown>
        </span>
      ))}
    </span>
  )
}
