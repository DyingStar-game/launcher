import { describe, expect, it } from 'vitest'
import { bbcodeToDocument, documentToBBCode } from './bbcodeDocument'

const roundTrip = (source: string): string => documentToBBCode(bbcodeToDocument(source))

describe('bbcodeToDocument', () => {
  it('turns lines into paragraphs and tags into marks', () => {
    expect(bbcodeToDocument('Pilot of the [b]Vel[/b]\n[color=red]Hi[/color]')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Pilot of the ' },
            { type: 'text', text: 'Vel', marks: [{ type: 'bold' }] }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hi', marks: [{ type: 'textStyle', attrs: { color: 'red' } }] }
          ]
        }
      ]
    })
  })

  it('makes [hr] a rule between paragraphs', () => {
    expect(bbcodeToDocument('a[hr]b').content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'a' }] },
      { type: 'horizontalRule' },
      { type: 'paragraph', content: [{ type: 'text', text: 'b' }] }
    ])
  })

  it('keeps unknown and unclosed tags as text', () => {
    expect(bbcodeToDocument('[url]x[/url] [b]open').content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: '[url]x[/url] [b]open' }] }
    ])
  })

  it('gives an empty text one empty paragraph', () => {
    expect(bbcodeToDocument('').content).toEqual([{ type: 'paragraph' }])
  })
})

describe('documentToBBCode', () => {
  it('keeps tags nested and short across marks', () => {
    expect(
      documentToBBCode({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'a', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'b', marks: [{ type: 'bold' }, { type: 'italic' }] },
              { type: 'text', text: 'c' }
            ]
          }
        ]
      })
    ).toBe('[b]a[i]b[/i][/b]c')
  })

  it('drops marks BBCode has no tag for', () => {
    expect(
      documentToBBCode({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'x', marks: [{ type: 'textStyle', attrs: {} }] }]
          }
        ]
      })
    ).toBe('x')
  })
})

describe('round trip', () => {
  it.each([
    '',
    'Plain text',
    'Pilot of the [b]Vel[/b], [color=cyan]free trader[/color].',
    'a[hr]b',
    'a\n[hr]\nb',
    '[hr]',
    'line 1\n\nline 3',
    '[b]bold over\ntwo lines[/b]',
    '[b]a[/b]\nb',
    '[b][i]both[/i][/b] [u]u[/u] [s]s[/s]',
    '[color=#ff8800]hex[/color]',
    '[b]a[hr]b[/b]',
    'Unknown [url]x[/url] and [b]unclosed',
    '[size=4]big[/size]'
  ])('gives back %j unchanged', (source) => {
    expect(roundTrip(source)).toBe(source)
  })

  it('keeps the order of nested tags', () => {
    expect(roundTrip('[i][b]x[/b][/i]')).toBe('[i][b]x[/b][/i]')
  })
})
