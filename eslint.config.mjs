import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'

/** Atomic design (ADR 0011): what each level of `src/renderer/components` may not import. */
const LEVELS = {
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
    ignores: ['src/renderer/components/atoms/**', 'src/renderer/**/*.test.tsx'],
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
  eslintConfigPrettier
)
