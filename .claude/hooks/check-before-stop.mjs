// Claude Code Stop hook (ADR 0019): a change is done only when `make check` passes (CLAUDE.md).
// Runs the same checks (format, lint, typecheck, test, format check) through pnpm, so it works
// without make, when the working tree differs from the last passing run. On failure, exit 2
// keeps Claude working with the output; a tree left unchanged after a failure lets it stop and
// report instead of looping.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const okFile = join(root, '.claude', '.check-ok')
const failedFile = join(root, '.claude', '.check-failed')
const sh = (cmd) => spawnSync(cmd, { cwd: root, encoding: 'utf8', shell: true })

// Fingerprint of the work: tracked changes and untracked files, outside personal files
const IGNORED = /^(\.vscode\/|\.claude\/\.check-|\.claude\/settings\.local\.json)/
const changedFiles = () =>
  sh('git status --porcelain --untracked-files=all')
    .stdout.split('\n')
    .filter((line) => line && !IGNORED.test(line.slice(3)))
const fingerprintOf = (status) => {
  const hash = createHash('sha1')
  hash.update(sh('git diff HEAD').stdout)
  for (const line of status.filter((l) => l.startsWith('??'))) {
    const file = join(root, line.slice(3))
    if (existsSync(file)) hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}

const status = changedFiles()
if (status.length === 0) process.exit(0)
const fingerprint = fingerprintOf(status)
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '')
if (read(okFile) === fingerprint || read(failedFile) === fingerprint) process.exit(0)

const steps = ['format', 'lint', 'typecheck', 'test', 'format:check']
for (const step of steps) {
  const result = sh(`pnpm ${step}`)
  if (result.status !== 0) {
    writeFileSync(failedFile, fingerprint)
    const output = `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(-60).join('\n')
    process.stderr.write(
      `\`pnpm ${step}\` failed: the change is not done until make check passes (CLAUDE.md).\n${output}\n`
    )
    process.exit(2)
  }
}
// Formatting may have touched files: record the tree as it is now
writeFileSync(okFile, fingerprintOf(changedFiles()))
