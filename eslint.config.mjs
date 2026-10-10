import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'

/** Atomic design (ADR 0011): what each level of `src/renderer/components` may not import. */
const LEVELS = {
  atoms: { message: 'atoms', paths: ['atoms'] },
  molecules: { message: 'molecules', paths: ['molecules'] },
  organisms: { message: 'organisms', paths: ['organisms'] },
  templates: { message: 'templates', paths: ['templates'] },
  pages: { message: 'pages', paths: ['pages'] }
}
const upward = (...levels) =>
  levels.map((level) => ({
    group: [`@components/${level}/*`, `**/${level}/**`].map((g) =>
      level === 'pages' ? g.replace('@components/pages', '@pages') : g
    ),
    message: `ADR 0011: this level may not import from ${LEVELS[level].message} (imports go down only).`
  }))
const noStores = {
  group: ['@stores/*'],
  message: 'ADR 0011: atoms, molecules and templates are pure — pass data and callbacks as props.'
}
const noWindowApi = [
  {
    object: 'window',
    property: 'api',
    message: 'ADR 0011: only organisms and pages reach main (through stores).'
  }
]
const levelRules = (patterns, pure) => ({
  'no-restricted-imports': ['error', { patterns }],
  ...(pure ? { 'no-restricted-properties': ['error', ...noWindowApi] } : {})
})

/**
 * ADR 0017: the className a caller passes to a component (capitalised JSX element) is for layout
 * only. Allowed: spacing, size, display and visibility (responsive prefixes included), flex / grid
 * placement, positioning, overflow, text alignment and truncation. Anything else (colours,
 * borders, radius, typography, state prefixes like `hover:`) belongs in the component's variants.
 */
const LAYOUT_CLASS =
  /^-?(?:m[trblxyse]?|p[trblxyse]?|space-[xy]|w|h|min-w|min-h|max-w|max-h|size|inset(?:-[xy])?|top|bottom|left|right|start|end|z|gap(?:-[xy])?|basis|order|col(?:-span|-start|-end)?|row(?:-span|-start|-end)?|flex|grow|shrink|self|justify(?:-items|-self)?|items|content|place-(?:content|items|self)|overflow(?:-[xy])?|whitespace|break)-.+$|^(?:hidden|block|inline|inline-block|inline-flex|inline-grid|flex|grid|contents|flow-root|relative|absolute|fixed|sticky|static|isolate|truncate|grow|shrink|sr-only|text-(?:left|right|center|justify|start|end))$/
const RESPONSIVE_PREFIX = /^(?:(?:sm|md|lg|xl|2xl|min-\[[^\]]+\]|max-\[[^\]]+\]):)+/

/** Collects the static class strings of a className value (literals, templates, cn() args). */
function classStrings(node, out = []) {
  if (!node) return out
  if (node.type === 'Literal' && typeof node.value === 'string') out.push(node.value)
  else if (node.type === 'TemplateLiteral') node.quasis.forEach((q) => out.push(q.value.cooked))
  else if (node.type === 'JSXExpressionContainer') classStrings(node.expression, out)
  else if (node.type === 'CallExpression') node.arguments.forEach((a) => classStrings(a, out))
  else if (node.type === 'ConditionalExpression') {
    classStrings(node.consequent, out)
    classStrings(node.alternate, out)
  } else if (node.type === 'LogicalExpression') classStrings(node.right, out)
  return out
}

const classNameLayoutOnly = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return
        const element = node.parent.name
        const name = element.type === 'JSXIdentifier' ? element.name : element.property?.name
        if (!name || !/^[A-Z]/.test(name)) return
        const visual = classStrings(node.value)
          .flatMap((value) => value.split(/\s+/))
          .filter(Boolean)
          .filter((cls) => !LAYOUT_CLASS.test(cls.replace(RESPONSIVE_PREFIX, '')))
        if (visual.length > 0) {
          context.report({
            node,
            message: `ADR 0017: className on <${name}> is for layout only; make a variant for: ${visual.join(' ')}`
          })
        }
      }
    }
  }
}

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': reactRefresh.plugin
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite().rules,
      'react/prop-types': 'off'
    }
  },
  {
    // ADR 0016: shadcn/ui primitives sit at the atom level and import no other level
    files: ['src/renderer/components/ui/**/*.{ts,tsx}'],
    rules: levelRules(
      [...upward('atoms', 'molecules', 'organisms', 'templates', 'pages'), noStores],
      true
    )
  },
  {
    // Generated shadcn/ui code is kept as generated (easy upstream updates): it exports its
    // variants next to the components and leaves return types inferred, as in adminpanel.
    files: ['src/renderer/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  {
    files: ['src/renderer/components/atoms/**/*.{ts,tsx}'],
    rules: levelRules([...upward('molecules', 'organisms', 'templates', 'pages'), noStores], true)
  },
  {
    files: ['src/renderer/components/molecules/**/*.{ts,tsx}'],
    rules: levelRules([...upward('organisms', 'templates', 'pages'), noStores], true)
  },
  {
    files: ['src/renderer/components/organisms/**/*.{ts,tsx}'],
    rules: levelRules(upward('templates', 'pages'), false)
  },
  {
    files: ['src/renderer/components/templates/**/*.{ts,tsx}'],
    rules: levelRules([...upward('pages'), noStores], true)
  },
  {
    // ADR 0015: buttons only through atoms, so every button shares the same variants
    files: ['src/renderer/**/*.tsx'],
    ignores: [
      'src/renderer/components/atoms/**',
      'src/renderer/components/ui/**',
      'src/renderer/**/*.test.tsx'
    ],
    rules: {
      'react/forbid-elements': [
        'error',
        {
          forbid: [
            {
              element: 'button',
              message:
                'ADR 0015: use an atom (Button, TabButton, MenuItemButton, SidebarItemButton) instead of a raw <button>.'
            }
          ]
        }
      ]
    }
  },
  {
    // ADR 0017: generated shadcn code composes Radix primitives with their own look
    files: ['src/renderer/**/*.tsx'],
    ignores: ['src/renderer/components/ui/**'],
    plugins: { launcher: { rules: { 'classname-layout-only': classNameLayoutOnly } } },
    rules: {
      'launcher/classname-layout-only': 'error',
      // ADR 0016: tooltips are Radix (LabelTooltip), never the native `title` attribute; the
      // listed components take `title` as a heading, not a tooltip
      'react/forbid-dom-props': ['error', { forbid: ['title'] }],
      'react/forbid-component-props': [
        'error',
        {
          forbid: [{ propName: 'title', allowedFor: ['PageHeader', 'SheetSection'] }]
        }
      ]
    }
  },
  {
    // Claude Code hooks (ADR 0019): plain Node scripts, no TypeScript return types
    files: ['.claude/**/*.mjs'],
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' }
  },
  eslintConfigPrettier
)
