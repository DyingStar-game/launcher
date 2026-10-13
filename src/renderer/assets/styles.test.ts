import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * ADR 0032: the look lives on the components, in Tailwind classes. The CSS files only hold the
 * theme, `@layer base`, `@utility` and Tailwind's at-rules: a class selector in them is a look
 * hidden away from its component.
 */
const dir = __dirname
const sheets = readdirSync(dir).filter((file) => file.endsWith('.css'))

/** The selectors of a stylesheet that name a class, with their at-rules skipped. */
function classSelectors(css: string): string[] {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...code.matchAll(/([^{};]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((prelude) => !prelude.startsWith('@'))
    .filter((prelude) => /\.[A-Za-z_-]/.test(prelude))
}

describe('stylesheets', () => {
  it.each(sheets)('%s declares no class of its own', (file) => {
    expect(classSelectors(readFileSync(join(dir, file), 'utf8'))).toEqual([])
  })

  it('reports a class selector', () => {
    expect(classSelectors('@utility app-drag { x: y; }\n.ds-panel { color: red; }')).toEqual([
      '.ds-panel'
    ])
  })
})
