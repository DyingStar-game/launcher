import type { ReactNode } from 'react'
import { parseBBCode, type BBCodeNode } from '@lib/bbcode'

/** React elements for a BBCode tree: no HTML is injected (ADR 0014). */
function renderNodes(nodes: BBCodeNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    if (typeof node === 'string') return node
    // A block inside the paragraph: `<hr>` cannot sit in a `<p>`.
    if (node.tag === 'hr') {
      return (
        <span
          key={i}
          role="separator"
          className="my-2 block border-t border-[var(--color-ds-border)]"
        />
      )
    }
    const children = renderNodes(node.children)
    switch (node.tag) {
      case 'b':
        return <strong key={i}>{children}</strong>
      case 'i':
        return <em key={i}>{children}</em>
      case 'u':
        return (
          <span key={i} className="underline">
            {children}
          </span>
        )
      case 's':
        return <s key={i}>{children}</s>
      case 'color':
        return (
          <span key={i} style={{ color: node.color }}>
            {children}
          </span>
        )
    }
  })
}

/** A player's text as the game shows it, its BBCode interpreted (ADR 0014). */
export default function BBCodeText({ text }: { text: string }): React.JSX.Element {
  return (
    <p className="text-sm text-[var(--color-ds-text)] whitespace-pre-wrap [overflow-wrap:anywhere]">
      {renderNodes(parseBBCode(text))}
    </p>
  )
}
