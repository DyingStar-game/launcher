# 0014. BBCode in player texts

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Social (player page)
- **Builds on:** [ADR 0012](./0012-sheets-as-pages.md)

## Context

Players write their biography and role-play story in game, in Godot's `RichTextLabel` with
BBCode on; the launcher showed the tags as typed (`[b]Salut[/b], c'est
[color=#F8C3CD]Frank Leboeuf[/color]`). The adminpanel met the same problem and solved it in
`apps/web/src/lib/bbcode.ts` (commit `aacec08`): it interprets the tags the game's editor
offers and keeps any other tag as typed, as Godot does.

## Decision

- Reuse adminpanel's interpretation: `@bbob/parser` (same version, 4.4.1) turns the text into a
  tree of **`[b]`, `[i]`, `[u]`, `[s]`, `[color=…]`** (hex or named colours) and **`[hr]`**
  (self-closing, options ignored); unclosed or other tags (`[url]`, `[size]`…) and odd colours
  stay as typed. Ported to `src/renderer/lib/bbcode.ts` with its tests.
- A pure molecule, `BBCodeText`, renders that tree (no HTML is injected: React elements only,
  colours as inline style). Used for the **biography** and the **role-play story**.
- Not taken from adminpanel: the "show the code" switch, a moderation need.

## Consequences

- Texts read as in game. A player can still colour a text dark enough to be hard to read on the
  launcher's background; accepted, as in game.
- When the game's editor gains tags, `lib/bbcode.ts` and adminpanel's copy evolve together.
