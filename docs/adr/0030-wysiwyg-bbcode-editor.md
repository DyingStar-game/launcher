# 0030. Writing player texts in a WYSIWYG editor, stored as BBCode

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Profile edit (and later organisation description)
- **Supersedes:** the textarea, toolbar and live preview of
  [ADR 0029](./0029-bbcode-toolbar.md); [ADR 0014](./0014-bbcode-player-texts.md) stands (which
  tags the game reads, how the sheet shows them)

## Context

ADR 0029 let players format their texts with a toolbar that inserts BBCode tags, and see a live
preview under the field. The maintainer (2026-10-10) prefers a WYSIWYG editor — the player sees
bold as bold while typing — knowing it is more demanding: "from a UX point of view it is better".

The game and `social` keep plain BBCode; the editor must read and write it, for the six things the
game reads (ADR 0014): `[b]`, `[i]`, `[u]`, `[s]`, `[color=…]`, `[hr]`. Tags the game does not read
(`[url]`…) and unclosed ones show as typed in game, so they must survive an edit unchanged.

## Options considered

1. **TipTap** (ProseMirror, MIT, React bindings, one package per feature) — a schema made only of
   the nodes and marks we allow; pasted rich text is reduced to that schema.
2. **Lexical** — similar, but colour needs a custom node and the ecosystem for marks is thinner.
3. **A `contentEditable` written by hand** — no dependency, but selection, undo and paste are the
   hard parts editors exist for.

## Decision

Option 1, `@tiptap/*` 3.x.

- **Schema**: document, paragraph, text, bold, italic, underline, strike, horizontal rule, text
  style + colour, undo/redo, placeholder. Nothing else (no headings, lists, links, code): what is
  pasted keeps only these.
- **BBCode ↔ document** is a pure module (`lib/bbcodeDocument.ts`, with its tests), built on
  `parseBBCode` (ADR 0014):
  - lines become paragraphs; `[hr]` a rule between them, with no line break added around it;
  - marks become tags, opened and closed as a stack so the BBCode stays nested and short;
  - a colour keeps the value it was written with (`red`, `#ff0000`); the menu offers the names the
    game reads (ADR 0029's list);
  - unknown or unclosed tags are plain text, written back as typed; reading then writing an
    unchanged text gives the same BBCode (the editor itself may put nested tags in its own order,
    `[i][b]` → `[b][i]`, the same in game).
- **`RichTextField`** (molecule): label, toolbar (shadcn `Toggle` for bold, italic, underline,
  strike — pressed when active; the colour `DropdownMenu`; the rule button), the editor, and the
  counter of BBCode characters against the limit. It is a controlled field for React Hook Form
  (ADR 0022): the value is the BBCode string.
- The live preview, the BBCode hint, the tag-inserting toolbar and `TextareaField` (with shadcn's
  `Textarea`, used by nothing else) go away: the editor shows the result.

## Consequences

- Players format like in a text editor; `social` and the game still get BBCode.
- TipTap and ProseMirror are new runtime dependencies (renderer only).
- Typing `[b]` by hand in the editor stays text until saved; once saved and reloaded it is read as
  bold — BBCode has no escaping, as in game.
- jsdom does not lay out text: the conversion is tested thoroughly as pure code, the editor in the
  running launcher (skill `verify-ui`).
