# 0046. Changelog sidebar: compact builds, unread dot, mark all as read

- **Status:** Accepted
- **Date:** 2026-10-21
- **Deciders:** maintainer
- **Scope:** Changelog sidebar (`organisms/changelog/ChangelogSidebar`, `lib/changelogEntries`,
  `stores/changelog`, `molecules/UnreadDot`), page sidebars' width (`atoms/PageSidebar`)
- **Supersedes:** the sidebar name of a dev release in
  [ADR 0042](./0042-changelog-dev-releases.md) ("Build 14/10/2026 17:30"); the rest of ADR 0042
  stands, its page title included

## Context

Universe Testing lists one line per testing build, folded under its version ("v0.1.0 · in
progress"). Each line reads "Build du 01/06/2026 01:59" followed by a "New" badge: in the
sidebar's narrow column the line wraps, and "Build" repeats on every line under a group that
already says what they are. A tester coming back after a few weeks finds dozens of unread builds,
and has to open each one to clear them; the changelog opens on the build they read last, not
the newest.

## Options considered

1. **Short date and time with the "New" badge.** Shorter, but the badge still takes a third of
   the line.
2. **Short date and time, unread as a dot.** The most compact line; the dot carries a label for
   screen readers.
3. **Relative date** ("2 days ago · 01:59"). Easy to read, but the label changes from one day to
   the next.

For clearing: a "mark all as read" button for the whole universe, or one per group of builds.

## Decision

We take option 2, and one button for the universe.

- **Build name in the sidebar:** the date, then the time ("01/06/2026 · 1:59"), without "Build",
  in the reader's locale and time zone, the hour without a leading zero. The page title keeps the
  full "Build du 01/06/2026 01:59".
- **Width:** the page sidebars (`PageSidebar`: changelog and social) go from 240 to 272 px
  (`w-68`). At 240 px "v0.1.0 · in progress" and its count wrapped in English (205 px of content
  for 189). A rendering test measures the builds and their group on one line, in English and
  French.
- **Unread:** every sidebar line shows a dot (`UnreadDot`, labelled "New") instead of the "New"
  badge, versions and builds alike: one look for one meaning. Group triggers keep their count
  (`PendingCount`).
- **Version shown at launch:** the newest one. The version shown is kept for the session only
  (coming back to the page keeps it), no longer between launches: a tester coming back days later
  landed on the build they last read, below the new ones. The stored read state goes to version 2,
  which drops the version kept by older launchers.
- **Mark all as read:** a button under the sidebar's heading, always shown and disabled once the
  active universe has nothing unread (a button vanishing on click moved the whole list); it marks
  every version of that universe as read (`markAllViewed`), the unreleased sections included. The other universe is left as it is. The dots disappearing are
  the feedback: no toast.

## Consequences

- One line per build and per group, whatever the locale.
- The social and changelog pages lose 32 px of content width (752 px left at the minimum
  window of 1024 px).
- Clearing a backlog is one click; a version read by mistake cannot be marked unread again.
- Reopening the launcher no longer brings back the version read last.
