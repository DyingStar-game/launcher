/** Localized changelog bullet entries. */
export type ChangelogLocaleEntries = {
  en: string[]
  fr: string[]
}

/** A released version block for one component. */
export type ChangelogRelease = {
  version: string
  date: string
  entries: ChangelogLocaleEntries
}

/** Changelog data for a single repository component. */
export type ChangelogComponent = {
  unreleased: ChangelogLocaleEntries
  releases: ChangelogRelease[]
}

/** Root payload fetched from the centralised changelog JSON. */
export type GlobalChangelog = {
  generated_at: string
  components: Record<string, ChangelogComponent>
}

import type { Env } from './env'

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
}
