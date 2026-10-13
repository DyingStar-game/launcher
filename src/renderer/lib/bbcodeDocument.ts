import type { JSONContent } from '@tiptap/core'
import { parseBBCode, type BBCodeNode } from './bbcode'

/**
 * BBCode ↔ editor document (ADR 0030). Lines are paragraphs, `[hr]` a rule between them with no
 * line break added; `[b]` `[i]` `[u]` `[s]` and `[color=…]` are marks. Anything else (unknown or
 * unclosed tags) is plain text, written back as typed.
 */

type Mark = { type: 'bold' | 'italic' | 'underline' | 'strike' } | ColorMark
type ColorMark = { type: 'textStyle'; attrs: { color: string } }

const MARK_OF_TAG = { b: 'bold', i: 'italic', u: 'underline', s: 'strike' } as const
const TAG_OF_MARK = { bold: 'b', italic: 'i', underline: 'u', strike: 's' } as const

/** The editor document of a BBCode text. */
export function bbcodeToDocument(source: string): JSONContent {
  const blocks: JSONContent[] = []
  let paragraph: JSONContent[] = []
  const endParagraph = (): void => {
    blocks.push(
      paragraph.length > 0 ? { type: 'paragraph', content: paragraph } : { type: 'paragraph' }
    )
    paragraph = []
  }
  const addText = (text: string, marks: Mark[]): void => {
    text.split('\n').forEach((line, index) => {
      if (index > 0) endParagraph()
      if (line)
        paragraph.push(
          marks.length > 0 ? { type: 'text', text: line, marks } : { type: 'text', text: line }
        )
    })
  }
  const walk = (nodes: BBCodeNode[], marks: Mark[]): void => {
    for (const node of nodes) {
      if (typeof node === 'string') addText(node, marks)
      else if (node.tag === 'hr') {
        endParagraph()
        blocks.push({ type: 'horizontalRule' })
      } else if (node.tag === 'color') {
        walk(node.children, [...marks, { type: 'textStyle', attrs: { color: node.color } }])
      } else {
        walk(node.children, [...marks, { type: MARK_OF_TAG[node.tag] }])
      }
    }
  }
  walk(parseBBCode(source), [])
  endParagraph()
  return { type: 'doc', content: blocks }
}

/** Opening and closing tags of a mark, or null for a mark BBCode has no tag for. */
function tagsOf(mark: { type: string; attrs?: Record<string, unknown> }): [string, string] | null {
  if (mark.type in TAG_OF_MARK) {
    const tag = TAG_OF_MARK[mark.type as keyof typeof TAG_OF_MARK]
    return [`[${tag}]`, `[/${tag}]`]
  }
  const color = mark.attrs?.color
  if (mark.type === 'textStyle' && typeof color === 'string' && color) {
    return [`[color=${color}]`, '[/color]']
  }
  return null
}

type Token = { kind: 'text'; text: string; tags: [string, string][] } | { kind: 'break' | 'rule' }

/** The BBCode of an editor document: tags opened and closed as a stack, so they stay nested. */
export function documentToBBCode(document: JSONContent): string {
  const tokens: Token[] = []
  let previous: string | undefined
  for (const block of document.content ?? []) {
    if (block.type === 'horizontalRule') tokens.push({ kind: 'rule' })
    else {
      if (previous === 'paragraph') tokens.push({ kind: 'break' })
      for (const inline of block.content ?? []) {
        if (inline.type !== 'text' || !inline.text) continue
        const tags = (inline.marks ?? [])
          .map(tagsOf)
          .filter((t): t is [string, string] => t !== null)
        tokens.push({ kind: 'text', text: inline.text, tags })
      }
    }
    previous = block.type
  }

  let out = ''
  const open: [string, string][] = []
  const same = (a: [string, string], b: [string, string]): boolean => a[0] === b[0]
  /** Closes the open tags `wanted` does not keep, innermost first. */
  const closeTo = (wanted: [string, string][]): void => {
    const keep = open.findIndex((tag) => !wanted.some((w) => same(w, tag)))
    if (keep === -1) return
    while (open.length > keep) out += open.pop()![1]
  }
  tokens.forEach((token, index) => {
    if (token.kind === 'text') {
      closeTo(token.tags)
      for (const tag of token.tags) {
        if (!open.some((o) => same(o, tag))) {
          out += tag[0]
          open.push(tag)
        }
      }
      out += token.text
      return
    }
    // A line break or a rule: tags the next text drops close before it, new ones open after it
    const next = tokens.slice(index + 1).find((t) => t.kind === 'text')
    closeTo(next?.kind === 'text' ? next.tags : [])
    out += token.kind === 'break' ? '\n' : '[hr]'
  })
  closeTo([])
  return out
}
