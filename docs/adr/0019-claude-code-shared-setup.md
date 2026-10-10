# 0019. Claude Code: shared instructions, hooks and skills in the repository

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Tooling (every contributor using Claude Code)

## Context

The project's rules live in ADRs and `CLAUDE.md`, and part of them is lint-enforced. While
working with Claude Code, the maintainer added more expectations (UI consistency checked in the
running launcher, how commits and pull requests are prepared) and some of them first went into
Claude's private memory, which only exists on one machine. The maintainer asked (2026-10-10)
that the rules be read and followed whoever works on the project with Claude Code.

Instructions alone are advisory: a rule is only reliable when something checks it.

## Decision

Everything Claude Code needs is in the repository, none of it in personal memory:

- **`CLAUDE.md`** (loaded for every developer) holds the working rules: the golden Git rule,
  the commands, the ADR-to-area map, the renderer rules, "Checking a UI change" and how to
  commit and update a pull request when asked.
- **Hooks** in `.claude/settings.json`, as Node scripts in `.claude/hooks/` (they run on every
  OS):
  - `lint-edited-file.mjs` (after `Edit` / `Write`): formats the edited file and lints it; a
    broken rule (atomic levels, buttons, `className`, `title`…) goes back to Claude at once.
  - `check-before-stop.mjs` (before Claude hands back): runs the `make check` steps through
    pnpm when the working tree changed since the last passing run; on failure Claude keeps
    working. The fingerprints of the last passing and failing runs (`.claude/.check-ok`,
    `.claude/.check-failed`, ignored by Git) avoid re-running on an unchanged tree and looping.
- **Skills** in `.claude/skills/`: `verify-ui` (run the launcher, capture, measure, drive it
  like a user) for any renderer change.
- Personal settings stay in `.claude/settings.local.json` (ignored by Git).

## Consequences

- A contributor opening the project in Claude Code gets the same rules, checks and procedures.
- A turn that changed code ends with a full check (about 15 s here); a turn with no change, or
  no change since the last run, is not slowed down.
- The hooks need Node and pnpm, which the project already requires (ADR 0006).
- A new rule goes into an ADR and `CLAUDE.md`, enforced by lint when it can be; a new repeatable
  procedure becomes a skill.
