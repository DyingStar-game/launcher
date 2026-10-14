import type { z } from 'zod'
import type { changelogItemSchema, globalChangelogSchema } from '@shared/schemas/changelog'
import type { Env } from './env'

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

/** A changelog bullet resolved for display: the area's label in the reader's language. */
export type ChangelogDisplayEntry = {
  area: string | null
  text: string
}

/** Entries of one type, in display order; label null for entries written before types. */
export type ChangelogGroup = {
  type: string | null
  label: string | null
  entries: ChangelogDisplayEntry[]
}

/** A sidebar line: a version, or the dev releases of a version folded together (ADR 0042). */
export type ChangelogSidebarBlock =
  | { kind: 'entry'; entry: ChangelogEntryRef }
  | { kind: 'dev'; componentId: string; version: string; entries: ChangelogEntryRef[] }

/** Sidebar / store identifier for a changelog section. */
export type ChangelogEntryKind = 'unreleased' | 'release'

export type ChangelogModuleKind = 'game' | 'service' | 'launcher'

export type ChangelogEntryRef = {
  id: string
  env: Env
  componentId: string
  moduleKind: ChangelogModuleKind
  kind: ChangelogEntryKind
  version: string | null
  date: string | null
  /** Withdrawn release (`[YANKED]`). */
  yanked: boolean
  /** Dev release (ADR 0042): the version it leads to (`0.1.0` for `0.1.0-dev.…`), else null. */
  devOf: string | null
  /** Stable release on Universe: how many dev releases it includes (ADR 0042). */
  devCount: number
}
