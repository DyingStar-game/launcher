// Claude Code PostToolUse hook (ADR 0019): formats the file Claude just edited and lints it, so a
// rule broken by the edit (atomic design, buttons, className, title…) comes back at once.
// Exit 2 sends stderr to Claude, which must fix it. Node only, so it runs on every OS.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const file = input.tool_input?.file_path
if (!file) process.exit(0)

const path = relative(root, resolve(root, file))
if (path.startsWith('..') || /(^|[\\/])node_modules[\\/]/.test(path)) process.exit(0)

// One command string (the path is JSON-quoted): `shell` finds pnpm on every OS
const run = (args) =>
  spawnSync(['pnpm', 'exec', ...args].join(' '), { cwd: root, encoding: 'utf8', shell: true })

if (/\.(ts|tsx|mjs|js|css|json|md|ya?ml)$/.test(path)) {
  run(['prettier', '--write', '--log-level', 'warn', JSON.stringify(path)])
}
if (/\.(ts|tsx|mjs|js)$/.test(path)) {
  const lint = run(['eslint', '--cache', JSON.stringify(path)])
  if (lint.status !== 0) {
    process.stderr.write(
      `ESLint failed on ${path} (rules from the ADRs, see CLAUDE.md); fix it before going on:\n` +
        (lint.stdout || lint.stderr)
    )
    process.exit(2)
  }
}
