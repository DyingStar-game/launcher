import type {
  ChangelogEntryRef,
  ChangelogGroup,
  ChangelogLocaleEntries,
  GlobalChangelog
} from '@shared/types/changelog'
import type { Env } from '@shared/types/env'

export const GAME_COMPONENT_ID = 'DyingStar'
export const LAUNCHER_COMPONENT_ID = 'launcher'

export type ChangelogModuleKind = 'game' | 'service' | 'launcher'

function hasEntries(entries: ChangelogLocaleEntries): boolean {
  return entries.en.length > 0 || entries.fr.length > 0
}

/**
 * Stable fingerprint of an unreleased section.
 * Used so unread badges only reappear when that component's content actually changes,
 * not when the global changelog JSON is regenerated (new `generated_at`).
 */
export function unreleasedFingerprint(entries: ChangelogLocaleEntries): string {
  return JSON.stringify({ en: entries.en, fr: entries.fr })
}

/** Classifies a JSON component key as game client, launcher, or backend service module. */
export function getModuleKind(componentId: string): ChangelogModuleKind {
  if (componentId === LAUNCHER_COMPONENT_ID) return 'launcher'
  if (componentId === GAME_COMPONENT_ID) return 'game'
  return 'service'
}

function moduleSortKey(componentId: string): number {
  const kind = getModuleKind(componentId)
  if (kind === 'game') return 0
  if (kind === 'service') return 1
  return 2
}

function sortComponentIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const keyDiff = moduleSortKey(a) - moduleSortKey(b)
    if (keyDiff !== 0) return keyDiff
    return a.localeCompare(b)
  })
}

function entryId(env: Env, componentId: string, suffix: string): string {
  return `${env}:${componentId}:${suffix}`
}

/** Builds sidebar entry refs filtered by active environment. */
export function buildChangelogEntryRefs(data: GlobalChangelog, env: Env): ChangelogEntryRef[] {
  const refs: ChangelogEntryRef[] = []
  const componentIds = sortComponentIds(Object.keys(data.components))

  for (const componentId of componentIds) {
    const component = data.components[componentId]
    if (!component) continue

    const moduleKind = getModuleKind(componentId)

    if (env === 'universe-testing') {
      if (moduleKind === 'launcher') continue
      if (!hasEntries(component.unreleased.entries)) continue

      refs.push({
        id: entryId(env, componentId, 'unreleased'),
        env,
        componentId,
        moduleKind,
        kind: 'unreleased',
        version: null,
        date: null,
        yanked: false
      })
      continue
    }

    const releases = [...component.releases].sort((a, b) => b.date.localeCompare(a.date))
    for (const release of releases) {
      if (!hasEntries(release.entries)) continue
      refs.push({
        id: entryId(env, componentId, release.version),
        env,
        componentId,
        moduleKind,
        kind: 'release',
        version: release.version,
        date: release.date,
        yanked: release.yanked
      })
    }
  }

  return refs
}

/**
 * Resolves the entries of a sidebar ref for display (ADR 0040): grouped by type in the JSON's
 * `types` order, entries without a type (written before types existed) last; each area as its
 * label in the reader's language. English entries when there are none in the reader's language.
 */
export function resolveChangelogGroups(
  data: GlobalChangelog,
  ref: ChangelogEntryRef,
  locale: string
): ChangelogGroup[] {
  const component = data.components[ref.componentId]
  if (!component) return []

  const localeEntries =
    ref.kind === 'unreleased'
      ? component.unreleased.entries
      : component.releases.find((r) => r.version === ref.version)?.entries
  if (!localeEntries) return []

  const lang = locale.startsWith('fr') ? 'fr' : 'en'
  const items = localeEntries[lang].length > 0 ? localeEntries[lang] : localeEntries.en

  return [...Object.keys(data.types), null].flatMap((type): ChangelogGroup[] => {
    const entries = items
      .filter((item) => item.type === type && item.text.trim())
      .map((item) => ({
        area: item.area === null ? null : (component.areas[item.area]?.[lang] ?? item.area),
        text: item.text
      }))
    if (entries.length === 0) return []
    const label = type === null ? null : (data.types[type]?.[lang] ?? type)
    return [{ type, label, entries }]
  })
}
