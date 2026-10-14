import type {
  ChangelogComponent,
  ChangelogEntryRef,
  ChangelogGroup,
  ChangelogLocaleEntries,
  ChangelogRelease,
  ChangelogSidebarBlock,
  GlobalChangelog
} from '@shared/types/changelog'
import type { Env } from '@shared/types/env'

export const GAME_COMPONENT_ID = 'DyingStar'
export const LAUNCHER_COMPONENT_ID = 'launcher'

export type ChangelogModuleKind = 'game' | 'service' | 'launcher'

/** Build time of a dev release, in its version: `0.1.0-dev.<UTC yyyymmddhhmm>` (ADR 0042). */
const DEV_STAMP_RE = /-dev\.(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(?:\D|$)/

function hasEntries(entries: ChangelogLocaleEntries): boolean {
  return entries.en.length > 0 || entries.fr.length > 0
}

/** The version a release leads to: itself without its pre-release part (`0.1.0-dev.…` → `0.1.0`). */
export function versionCore(version: string): string {
  return version.split(/[-+]/)[0] ?? version
}

/** Dev releases of a component leading to `version`, with entries, newest build first. */
function devReleasesOf(component: ChangelogComponent, version: string): ChangelogRelease[] {
  return component.releases
    .filter((r) => r.dev && versionCore(r.version) === version && hasEntries(r.entries))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
}

/** Whether a component has released `version` (a stable release of that exact version). */
export function isReleased(data: GlobalChangelog, componentId: string, version: string): boolean {
  return (
    data.components[componentId]?.releases.some((r) => !r.dev && r.version === version) ?? false
  )
}

/**
 * Build time of a dev release, from its version (UTC), in the reader's locale; null when the
 * version carries no build time (ADR 0042).
 */
export function formatDevBuild(version: string, locale: string): string | null {
  const m = DEV_STAMP_RE.exec(version)
  if (!m) return null
  const [, year, month, day, hour, minute] = m.map(Number)
  const time = new Date(Date.UTC(year, month - 1, day, hour, minute))
  return time.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
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

/**
 * Builds sidebar entry refs filtered by active environment (ADR 0042): on Universe Testing the
 * unreleased section then the dev releases by version; on Universe the stable releases, each
 * followed by its dev releases.
 */
export function buildChangelogEntryRefs(data: GlobalChangelog, env: Env): ChangelogEntryRef[] {
  const refs: ChangelogEntryRef[] = []
  const componentIds = sortComponentIds(Object.keys(data.components))

  for (const componentId of componentIds) {
    const component = data.components[componentId]
    if (!component) continue

    const moduleKind = getModuleKind(componentId)
    const releaseRef = (
      release: ChangelogRelease,
      devOf: string | null,
      devCount: number
    ): ChangelogEntryRef => ({
      id: entryId(env, componentId, release.version),
      env,
      componentId,
      moduleKind,
      kind: 'release',
      version: release.version,
      date: release.date,
      yanked: release.yanked,
      devOf,
      devCount
    })

    if (env === 'universe-testing') {
      if (moduleKind === 'launcher') continue
      if (hasEntries(component.unreleased.entries)) {
        refs.push({
          id: entryId(env, componentId, 'unreleased'),
          env,
          componentId,
          moduleKind,
          kind: 'unreleased',
          version: null,
          date: null,
          yanked: false,
          devOf: null,
          devCount: 0
        })
      }
      // Versions in the order of their newest build
      const targets = new Set(
        component.releases.filter((r) => r.dev).map((r) => versionCore(r.version))
      )
      for (const target of targets) {
        for (const release of devReleasesOf(component, target)) {
          refs.push(releaseRef(release, target, 0))
        }
      }
      continue
    }

    const releases = component.releases
      .filter((r) => !r.dev)
      .sort((a, b) => b.date.localeCompare(a.date))
    for (const release of releases) {
      const devs = devReleasesOf(component, release.version)
      if (!hasEntries(release.entries) && devs.length === 0) continue
      refs.push(releaseRef(release, null, devs.length))
      for (const dev of devs) refs.push(releaseRef(dev, release.version, 0))
    }
  }

  return refs
}

/** Folds the consecutive dev releases of a version into one sidebar block (ADR 0042). */
export function groupDevReleases(refs: ChangelogEntryRef[]): ChangelogSidebarBlock[] {
  const blocks: ChangelogSidebarBlock[] = []
  for (const entry of refs) {
    const last = blocks.at(-1)
    if (entry.devOf === null) {
      blocks.push({ kind: 'entry', entry })
    } else if (
      last?.kind === 'dev' &&
      last.componentId === entry.componentId &&
      last.version === entry.devOf
    ) {
      last.entries.push(entry)
    } else {
      blocks.push({
        kind: 'dev',
        componentId: entry.componentId,
        version: entry.devOf,
        entries: [entry]
      })
    }
  }
  return blocks
}

/**
 * Resolves the entries of a sidebar ref for display (ADR 0040): grouped by type in the JSON's
 * `types` order, entries without a type (written before types existed) last; each area as its
 * label in the reader's language. English entries when there are none in the reader's language.
 * A stable release also gathers the entries of its dev releases (ADR 0042).
 */
export function resolveChangelogGroups(
  data: GlobalChangelog,
  ref: ChangelogEntryRef,
  locale: string
): ChangelogGroup[] {
  const component = data.components[ref.componentId]
  if (!component) return []

  const release = component.releases.find((r) => r.version === ref.version)
  const sources =
    ref.kind === 'unreleased'
      ? [component.unreleased.entries]
      : release && !release.dev
        ? [release.entries, ...devReleasesOf(component, release.version).map((r) => r.entries)]
        : release
          ? [release.entries]
          : []
  if (sources.length === 0) return []

  const lang = locale.startsWith('fr') ? 'fr' : 'en'
  const items = sources.flatMap((entries) =>
    entries[lang].length > 0 ? entries[lang] : entries.en
  )

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
