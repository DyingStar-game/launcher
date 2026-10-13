# 0029. A BBCode toolbar and a live preview to write player texts

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Profile edit (and later organisation description)
- **Builds on:** [ADR 0014](./0014-bbcode-player-texts.md) (which tags the game reads, how the
  launcher shows them), [ADR 0020](./0020-edit-own-profile.md) (profile edit)

## Context

Players can now write their biography and role-play story (ADR 0020), in BBCode, by typing the
tags. The maintainer (2026-10-10) asked whether a library handles BBCode.

- **Showing** BBCode already relies on one: `@bbob/parser`, with ~60 lines (`lib/bbcode.ts`,
  `BBCodeText`) that mirror the game's `RichTextLabel` — unknown or unclosed tags stay as typed,
  `[hr]` closes itself. `@bbob/react` + `@bbob/preset-react` would render to React directly but
  interpret more tags (`[url]`, `[img]`, lists) and those edge cases differently; matching the
  game again would mean a custom preset, for no gain.
- **Writing**: SCEditor is a WYSIWYG BBCode editor, but framework-free, heavy and with its own
  look (one style only, ADR 0027).

## Decision

- Showing stays as ADR 0014 decided.
- Long player texts get a **toolbar** above shadcn's `Textarea` (`TextareaField bbcode`): bold,
  italic, underline, strikethrough, a colour menu (names the game reads: red, orange, yellow,
  green, cyan, blue, purple, pink, white, gray) and the horizontal rule. A button wraps the
  selection in its tags (or inserts both with the caret between them; `[hr]` at the caret), then
  gives the field back its focus and selection; an insertion past the length limit is refused.
- Under the field, a **live preview** renders the text with `BBCodeText` (ADR 0014), as the sheet
  and the game show it; asked by the maintainer on 2026-10-10.
- Built from what exists: shadcn `Button` (`ghost`, `icon-sm`), `DropdownMenu`, `LabelTooltip`,
  `lucide-react` icons. The text logic is a pure function (`wrapSelection`) with its tests.

## Consequences

- Players format without knowing the tags; the texts stay plain BBCode, as the game expects.
- What the player sees under the field is what others will see on the sheet.
