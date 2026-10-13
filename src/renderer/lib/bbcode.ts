import { parse } from '@bbob/parser'

/**
 * BBCode of a player's texts (ADR 0014), ported from adminpanel (`apps/web/src/lib/bbcode.ts`).
 * The game shows a player's biography and RP story in Godot's `RichTextLabel` with BBCode on,
 * whose editor offers `[b]`, `[i]`, `[u]` and `[color=#…]`. Those, `[s]` and Godot's horizontal
 * rule `[hr]` (its options ignored) are interpreted; any other tag stays as typed, as in game.
 */
export type BBCodeNode =
  | string
  | { tag: 'b' | 'i' | 'u' | 's'; children: BBCodeNode[] }
  | { tag: 'color'; color: string; children: BBCodeNode[] }
  | { tag: 'hr' }

const STYLE_TAGS = new Set(['b', 'i', 'u', 's'])

/** A colour Godot reads: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, or a name (`red`). */
const COLOR = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+)$/i

interface TagNode {
  tag: string
  attrs: Record<string, string>
  content: unknown[] | null
  start?: { from: number; to: number }
  end?: { from: number; to: number }
}

const isTag = (node: unknown): node is TagNode =>
  typeof node === 'object' && node !== null && 'tag' in node

/** Joins neighbouring strings, so a text is one node. */
function merge(nodes: BBCodeNode[]): BBCodeNode[] {
  const out: BBCodeNode[] = []
  for (const node of nodes) {
    const last = out.at(-1)
    if (typeof node === 'string' && typeof last === 'string') out[out.length - 1] = last + node
    else if (node !== '') out.push(node)
  }
  return out
}

/** The text's BBCode as a tree of the allowed tags and plain text. */
export function parseBBCode(source: string): BBCodeNode[] {
  const raw = (range?: { from: number; to: number }): string =>
    range ? source.slice(range.from, range.to) : ''
  const walk = (nodes: unknown[]): BBCodeNode[] =>
    merge(
      nodes.flatMap((node): BBCodeNode[] => {
        if (!isTag(node)) return [String(node)]
        const children = walk(node.content ?? [])
        const tag = node.tag.toLowerCase()
        // Self-closing in Godot: a closing `[/hr]` is not one of its tags.
        if (tag === 'hr') return [{ tag: 'hr' }, ...children, raw(node.end)]
        // Unclosed, or not one of the editor's: shown as typed.
        if (!node.end) return [raw(node.start), ...children]
        if (STYLE_TAGS.has(tag)) {
          return [{ tag: tag as 'b' | 'i' | 'u' | 's', children }]
        }
        const color = Object.values(node.attrs)[0]
        if (tag === 'color' && color && COLOR.test(color)) {
          return [{ tag: 'color', color, children }]
        }
        return [raw(node.start), ...children, raw(node.end)]
      })
    )
  return walk(parse(source) as unknown[])
}

/** Colours offered by the editor's toolbar: names Godot's `RichTextLabel` reads (ADR 0029, 0030). */
export const BBCODE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'white',
  'gray'
] as const
