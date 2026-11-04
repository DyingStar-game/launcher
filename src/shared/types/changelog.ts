import type { z } from 'zod'
import type { changelogItemSchema, globalChangelogSchema } from '@shared/schemas/changelog'

/** Root payload fetched from the centralised changelog JSON (ADR 0040). */
export type GlobalChangelog = z.infer<typeof globalChangelogSchema>

/** Changelog data for a single repository component. */
export type ChangelogComponent = GlobalChangelog['components'][string]

/** A released version block for one component. */
export type ChangelogRelease = ChangelogComponent['releases'][number]

/** Localized changelog entries. */
export type ChangelogLocaleEntries = ChangelogRelease['entries']

/** One changelog bullet, with its type and area keys. */
export type ChangelogItem = z.infer<typeof changelogItemSchema>

/** A changelog bullet resolved for the feed, in the reader's language (ADR 0051). */
export type ChangelogFeedItem = {
  componentId: string
  /** Type key, null for entries written before types. */
  type: string | null
  /** The area's label, null when the entry has none. */
  area: string | null
  text: string
  /** When it came out, in ms: the build's time, or the release's date. */
  publishedAt: number
  /** Version of the dev release it came with, null for a stable release's own entries. */
  build: string | null
}

/** A build listed at the end of a day of the feed (ADR 0051). */
export type ChangelogFeedBuild = {
  componentId: string
  version: string
  yanked: boolean
}

/** A section of the feed: a day on Universe Testing, a stable release on Universe (ADR 0051). */
export type ChangelogFeedSection = {
  id: string
  /** Newest publication in the section, in ms. */
  publishedAt: number
  items: ChangelogFeedItem[]
} & (
  | { kind: 'day'; builds: ChangelogFeedBuild[] }
  | { kind: 'release'; componentId: string; version: string; yanked: boolean }
)

/** The whole feed of a universe, newest section first (ADR 0051). */
export type ChangelogFeed = {
  /** What the next build will bring: not in the game yet. */
  upcoming: ChangelogFeedItem[]
  sections: ChangelogFeedSection[]
}

/** What counts as new: published after `since`, and not among the publication times in `seen`. */
export type ChangelogNewMark = {
  since: number
  seen: number[]
}

/** Entries of one type, in display order; label null for entries written before types. */
export type ChangelogGroup = {
  type: string | null
  label: string | null
  entries: ChangelogFeedItem[]
}
