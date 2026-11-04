# 0051. Changelog page: one feed by day instead of a sidebar of versions

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** maintainer
- **Scope:** Changelog page (`pages/ChangelogPage`, `organisms/changelog/ChangelogFeed`,
  `lib/changelogEntries`, `stores/changelog`, `hooks/changelog/useChangelog`), its molecules and atoms
- **Supersedes:** the sidebar, unread and "version shown" rules of
  [ADR 0042](./0042-changelog-dev-releases.md) and
  [ADR 0046](./0046-changelog-compact-builds-and-mark-all-read.md), and the one-page-per-version
  layout of [ADR 0040](./0040-changelog-types-and-areas.md). What stands: `global.v2.json` checked
  in main, entries grouped by type, the dev releases gathered under their stable release on
  Universe, the page sidebars' width for the social page.
  Also supersedes "One style: shadcn's variants as they are, no launcher variant" in
  [ADR 0027](./0027-shadcn-first-badge.md): the Badge may have launcher variants.

## Context

A tester reported having trouble finding their way in the changelog, and asked for bigger module
titles or a coloured band: the titles (10 px) are smaller than the lines under them (14 px). The
titles are the visible part of a deeper problem: the sidebar mirrors how the data is stored
(module → version → build), while a player mostly wonders what changed since their last game.

On the JSON of 2026-11-04, on Universe Testing:

- 31 of the 67 builds hold 3 entries or fewer: a click per page, sometimes for one line;
- 20 of the 35 days with a build touch two modules: one day is split in two places;
- the 67 builds all lead to `0.1.0`: the version level tells nothing apart;
- "New features" repeats per module and opens first, though it holds what is not in the game yet
  (ADR 0042: the next build), under a subtitle saying "Changes available in testing".

## Options considered

1. **Bigger titles and clearer labels.** A small change, but the long list and the module split
   stay.
2. **Bigger titles with a band.** Same limits, and in that column a background already means
   selected or hovered: a band looks clickable.
3. **One tab per module above the sidebar.** No more repeated lines, but still one page per build,
   and a split by module that matters little to players, whose entries are written for them.
4. **One feed by day, modules as filters.** Answers the player's question, at the cost of the page
   per build and of reading state per version.

A static mockup of option 4 with the real data was approved by the maintainer and by the tester
who reported the problem.

## Decision

We take option 4.

- **No sidebar.** The page is one column (`ColumnPageLayout`). On top, one filter per module with
  something to show, and "All": a filter, not a part of the structure. Under "All" on Universe
  Testing, every entry shows its module, the game included, as a `Badge variant="subtle"` (grey):
  without a tag on the game's entries, the absence had to be guessed, plain text read as the end of
  the sentence, and `outline`, amber like every other variant with a frame, blended with the amber
  area next to it. Hence this launcher variant. The maintainer (2026-11-04) drops
  ADR 0027's ban: like `ui/button`, the Badge may get a launcher variant when a need justifies it;
  the rest of ADR 0027 stands (take from shadcn/ui what it provides, statuses and counts through
  `StatusBadge` and `PendingCount`). On Universe, a release's title already names its module: no tag.
- **Universe Testing: one section per day**, newest first, in the reader's time zone, gathering
  the builds of that day across modules. Entries are grouped by type (ADR 0040).
- **Builds stay findable:** each day ends with the line naming its builds ("2 builds: Dying Star
  0.1.0-dev.… · Dying Star 0.1.0-dev.…"), and the area of an entry gives its build in a tooltip,
  for bug reports. Not on the whole line: it would open under the pointer while reading.
- **Universe: one section per stable release**, newest first, gathering the entries of its dev
  releases (ADR 0042), the launcher as one more module. A withdrawn release keeps its `destructive`
  Badge. Dev releases of a version not released yet stay unlisted.
- **What comes next is apart:** "Coming in the next build", folded on top with a "Not in the game
  yet" badge, on Universe Testing only. It is never counted as new: the player does not have it.
- **Reading state is one date per universe, plus what was opened since.** `lastSeenByEnv` holds the
  time up to which everything is seen, in place of a read flag per version. An entry is unread when
  published after it and not among `seenTimesByEnv`, the publications on screen in an open section.
  The universe bar's count and the filters' counts are these unread entries: they fall as days open,
  and a day folded stays counted, also after a restart. Once every publication is seen, the date
  moves to the newest and the list empties: it never grows past what the player left to read.
  Opening the page alone does not clear anything. A first draft did, and a tester back after weeks
  lost the folded days under "Already seen" without having read them.
- **Mark all as read** stays (ADR 0046): always shown, disabled with its reason once nothing is
  unread, for the active universe only, no toast. Without it, coming back after weeks means opening
  each day.
- **The mark.** "New since the last visit" sits above the sections holding what was unread when the
  page first opened in this launch, "Already seen" under them. It stays until the launcher is
  closed (`shownMarkByEnv`, not stored), so what was just read does not jump down the page; at the
  next launch, what was read goes under "Already seen" and the rest stays above.
- **Folding (`FoldSection`).** The 3 newest sections with something new are open, the others folded
  on one line with their count and main areas; with nothing new, the newest section is open. Past
  the mark, 10 sections are listed before a "Show older" button.
- **First launch, or first launch with this version:** only the newest publication counts as new.
  The stored read state goes to version 3, dropping the old one: reading per version cannot be
  converted, and counting the whole history would show hundreds.
- **Text colour.** The body of an entry is a light neutral (`text-ds-body`), its area stays amber,
  as in the approved mockup: amber on long lists is tiring. Secondary text of the feed uses
  `text-ds-subtle`, more legible than `text-ds-muted` on these surfaces.
- **The changelog moves to TanStack Query**, as ADR 0025 asks when it next changes: `useChangelog`
  reads it, read once (`staleTime: Infinity`) and again after an install (`changelogKeys`), a read
  that fails keeping the one known. `stores/changelog` keeps client state only: the two dates above.
- **Line breaks in an entry are soft wraps:** the JSON holds hard-wrapped sentences (72 of 1592
  entries) and no list, so a bullet is one paragraph. The muted continuation lines go away.

## Consequences

- The problem reported disappears with the module titles; a day is read by scrolling.
- A page per build is gone, so is a direct view of one build's entries, besides the tooltip.
- Two releases on one date, one seen before the other came out: the second is not counted as new,
  a stable release having a date and no time. Accepted, stable releases being far apart.
- Every player sees the newest publication as new once, on this update.
- The home page's "See the full changelog" opens the feed without selecting an entry.
- `version.json`'s `devRelease` could mark "Installed version" in the feed: left for later.
