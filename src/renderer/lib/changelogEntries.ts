import type { ChangelogEntryRef, GlobalChangelog } from '@shared/types/changelog'
import type { Env } from '@shared/types/env'

export const GAME_COMPONENT_ID = 'DyingStar'
export const LAUNCHER_COMPONENT_ID = 'launcher'

export type ChangelogModuleKind = 'game' | 'service' | 'launcher'

function hasEntries(entries: { en: string[]; fr: string[] }): boolean {
  return entries.en.length > 0 || entries.fr.length > 0
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
      if (!hasEntries(component.unreleased)) continue

      refs.push({
        id: entryId(env, componentId, 'unreleased'),
        env,
        componentId,
        moduleKind,
        kind: 'unreleased',
        version: null,
        date: null
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
        date: release.date
      })
    }
  }

  return refs
}

/** Resolves localized bullet entries for a sidebar ref. */
export function resolveChangelogEntries(
  data: GlobalChangelog,
  ref: ChangelogEntryRef,
  locale: string
): string[] {
  const component = data.components[ref.componentId]
  if (!component) return []

  const lang = locale.startsWith('fr') ? 'fr' : 'en'

  if (ref.kind === 'unreleased') {
    const entries = component.unreleased[lang]
    return entries.length > 0 ? entries : component.unreleased.en
  }

  const release = component.releases.find((r) => r.version === ref.version)
  if (!release) return []
  const entries = release.entries[lang]
  return entries.length > 0 ? entries : release.entries.en
}
