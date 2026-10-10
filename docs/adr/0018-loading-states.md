# 0018. Loading states: skeletons for content, a spinner in action buttons

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer

## Context

While the renderer waits for main (social service, changelog), it shows a line of text:
"Loading…" in place of a list or of a whole player or organisation page, "Searching…" for the
player search, "…" in place of a button label (add, join, apply, create). Only the accept /
decline buttons of a friend request spin. The page then jumps when the content arrives, an empty
page with one word reads as broken, and a button whose label turns into "…" changes width.

## Decision

- **Content that is loading shows a skeleton of its shape**: pulsing blocks laid out like the
  content to come, so nothing moves when it arrives.
  - `components/ui/skeleton.tsx` (shadcn `Skeleton`, owned code, ADR 0016) with a `shape`
    variant (`line`, `circle`, `square`, `block`) and the launcher colours; it pulses with
    Tailwind's own `animate-pulse` (no extra dependency).
  - Molecules compose it per shape: `RowSkeleton` / `ListSkeleton` (a list row: avatar, two
    lines, optional action), `DetailHeaderSkeleton` and `StatsSkeleton` (a detail page's avatar
    and name, its three figures; they fill `DetailPageLayout`'s slots) and `TextSkeleton`
    (paragraph lines).
  - Used for: the social lists (friends, organisations, requests) and the universe social panel,
    the player search results, the player and organisation pages, an organisation's member list,
    the changelog.
- **Skeletons wait 150 ms before showing** (`useDelayedFlag`): an answer faster than that goes
  straight to the content, with no grey flash.
- **An action button that waits keeps its size and shows a spinner**: `Button` gets a `loading`
  prop that disables it, sets `aria-busy`, hides the label (kept for the width) and centres a
  spinning lucide `Loader2` icon. This replaces "…" labels and the request rows' own spinner.
- Waits that are not API answers keep their message: the sign-in window (the player acts in the
  browser) and the game install progress.
- Skeletons are decorative (`aria-hidden`); the region that loads carries `aria-busy` so
  assistive technologies know content is coming.

## Consequences

- One loading look across the launcher; a new screen that loads data uses these molecules.
- The "Loading…" and "Searching…" strings that only served as placeholders are removed.
- Every skeleton molecule and the `Button` loading state get tests (ADR 0011).
