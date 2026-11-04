import type {
  ChangelogComponent,
  ChangelogFeed,
  ChangelogFeedBuild,
  ChangelogFeedItem,
  ChangelogFeedSection,
  ChangelogGroup,
  ChangelogNewMark,
  ChangelogLocaleEntries,
  ChangelogRelease,
  GlobalChangelog
} from '@shared/types/changelog'
import type { Env } from '@shared/types/env'

const GAME_COMPONENT_ID = 'DyingStar'
const LAUNCHER_COMPONENT_ID = 'launcher'

/** Build time of a dev release, in its version: `0.1.0-dev.<UTC yyyymmddhhmm>` (ADR 0042). */
const DEV_STAMP_RE = /-dev\.(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(?:\D|$)/

type Lang = 'en' | 'fr'

function readerLang(locale: string): Lang {
  return locale.startsWith('fr') ? 'fr' : 'en'
}

/** The version a release leads to: itself without its pre-release part (`0.1.0-dev.…` → `0.1.0`). */
export function versionCore(version: string): string {
  return version.split(/[-+]/)[0] ?? version
}

/** A date without a time (`2026-11-03`), at midnight in the reader's time zone; 0 when invalid. */
function dateToMs(date: string): number {
  const time = new Date(`${date}T00:00:00`).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** When a dev release came out: its build time (UTC, ADR 0042), or its date without one. */
function devPublishedAt(release: ChangelogRelease): number {
  const m = DEV_STAMP_RE.exec(release.version)
  if (!m) return dateToMs(release.date)
  const [, year, month, day, hour, minute] = m.map(Number)
  return Date.UTC(year, month - 1, day, hour, minute)
}

/** A day of the feed, in the reader's time zone. */
function dayKey(time: number): string {
  const date = new Date(time)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Title of a day of the feed ("Mardi 3 novembre"), with its year when not the current one. */
export function formatFeedDay(time: number, locale: string, now = Date.now()): string {
  const date = new Date(time)
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  const label = date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' })
  })
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1)
}

/** Date of a stable release in the feed ("3 novembre 2026"). */
export function formatFeedDate(time: number, locale: string): string {
  return new Date(time).toLocaleDateString(locale, { dateStyle: 'long' })
}

function moduleSortKey(componentId: string): number {
  if (componentId === GAME_COMPONENT_ID) return 0
  return componentId === LAUNCHER_COMPONENT_ID ? 2 : 1
}

function sortComponentIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => moduleSortKey(a) - moduleSortKey(b) || a.localeCompare(b))
}

/** The entries of a block as feed items; English when there are none in the reader's language. */
function feedItems(
  componentId: string,
  component: ChangelogComponent,
  entries: ChangelogLocaleEntries,
  lang: Lang,
  publishedAt: number,
  build: string | null
): ChangelogFeedItem[] {
  const items = entries[lang].length > 0 ? entries[lang] : entries.en
  return items
    .filter((item) => item.text.trim())
    .map((item) => ({
      componentId,
      type: item.type,
      area: item.area === null ? null : (component.areas[item.area]?.[lang] ?? item.area),
      text: item.text,
      publishedAt,
      build
    }))
}

/** Days of the builds of every module but the launcher, newest first (ADR 0051). */
function testingSections(data: GlobalChangelog, ids: string[], lang: Lang): ChangelogFeedSection[] {
  const days = new Map<string, Extract<ChangelogFeedSection, { kind: 'day' }>>()

  for (const componentId of ids) {
    const component = data.components[componentId]
    if (!component || componentId === LAUNCHER_COMPONENT_ID) continue

    const builds = component.releases
      .filter((release) => release.dev)
      .map((release) => ({ release, publishedAt: devPublishedAt(release) }))
      .sort((a, b) => b.publishedAt - a.publishedAt)

    for (const { release, publishedAt } of builds) {
      const items = feedItems(
        componentId,
        component,
        release.entries,
        lang,
        publishedAt,
        release.version
      )
      if (items.length === 0) continue

      const key = dayKey(publishedAt)
      const day = days.get(key) ?? { id: key, kind: 'day', publishedAt, items: [], builds: [] }
      days.set(key, day)
      day.publishedAt = Math.max(day.publishedAt, publishedAt)
      day.items.push(...items)
      day.builds.push({ componentId, version: release.version, yanked: release.yanked })
    }
  }

  return [...days.values()]
}

/** Stable releases of every module, each with the entries of its dev releases (ADR 0042, 0051). */
function universeSections(
  data: GlobalChangelog,
  ids: string[],
  lang: Lang
): ChangelogFeedSection[] {
  return ids.flatMap((componentId) => {
    const component = data.components[componentId]
    if (!component) return []

    return component.releases
      .filter((release) => !release.dev)
      .flatMap((release): ChangelogFeedSection[] => {
        const publishedAt = dateToMs(release.date)
        const items = [
          ...feedItems(componentId, component, release.entries, lang, publishedAt, null),
          ...component.releases
            .filter((dev) => dev.dev && versionCore(dev.version) === release.version)
            .sort((a, b) => devPublishedAt(b) - devPublishedAt(a))
            .flatMap((dev) =>
              feedItems(componentId, component, dev.entries, lang, publishedAt, dev.version)
            )
        ]
        if (items.length === 0) return []
        return [
          {
            id: `${componentId}:${release.version}`,
            kind: 'release',
            componentId,
            version: release.version,
            yanked: release.yanked,
            publishedAt,
            items
          }
        ]
      })
  })
}

/** Builds the feed of a universe in the reader's language (ADR 0051). */
export function buildChangelogFeed(data: GlobalChangelog, env: Env, locale: string): ChangelogFeed {
  const lang = readerLang(locale)
  const ids = sortComponentIds(Object.keys(data.components))
  const sections =
    env === 'universe-testing'
      ? testingSections(data, ids, lang)
      : universeSections(data, ids, lang)

  const upcoming =
    env === 'universe-testing'
      ? ids
          .filter((id) => id !== LAUNCHER_COMPONENT_ID)
          .flatMap((id) => {
            const component = data.components[id]
            return component
              ? feedItems(id, component, component.unreleased.entries, lang, 0, null)
              : []
          })
      : []

  return { upcoming, sections: sections.sort((a, b) => b.publishedAt - a.publishedAt) }
}

/** The feed restricted to one module; a section left without entries goes away. */
export function filterChangelogFeed(
  feed: ChangelogFeed,
  componentId: string | null
): ChangelogFeed {
  if (componentId === null) return feed
  const keep = (item: ChangelogFeedItem): boolean => item.componentId === componentId
  const keepBuild = (build: ChangelogFeedBuild): boolean => build.componentId === componentId

  return {
    upcoming: feed.upcoming.filter(keep),
    sections: feed.sections
      .map((section) =>
        section.kind === 'day'
          ? {
              ...section,
              items: section.items.filter(keep),
              builds: section.builds.filter(keepBuild)
            }
          : { ...section, items: section.items.filter(keep) }
      )
      .filter((section) => section.items.length > 0)
  }
}

/** The modules with something to show in a feed, the game first. */
export function changelogFeedModules(feed: ChangelogFeed): string[] {
  const ids = [...feed.upcoming, ...feed.sections.flatMap((section) => section.items)].map(
    (item) => item.componentId
  )
  return sortComponentIds([...new Set(ids)])
}

/** Nothing is new under this mark. */
export const NOTHING_NEW: ChangelogNewMark = { since: Infinity, seen: [] }

/** How many entries of the sections are new under a mark (what comes next is never counted). */
export function countNewItems(sections: ChangelogFeedSection[], mark: ChangelogNewMark): number {
  const seen = new Set(mark.seen)
  return sections.reduce(
    (count, section) =>
      count +
      section.items.filter((item) => item.publishedAt > mark.since && !seen.has(item.publishedAt))
        .length,
    0
  )
}

/** Publication times of a feed, newest first, each once. */
export function publicationTimes(feed: ChangelogFeed): number[] {
  const times = feed.sections.flatMap((section) => section.items.map((item) => item.publishedAt))
  return [...new Set(times)].sort((a, b) => b - a)
}

/** Newest publication of a feed; null when it has none. */
export function newestPublication(feed: ChangelogFeed): number | null {
  return publicationTimes(feed)[0] ?? null
}

/**
 * Starting point of a player with no reading state: just before the newest publication, which alone
 * counts as new (ADR 0051); null when the feed has none.
 */
export function initialLastSeen(feed: ChangelogFeed): number | null {
  const [newest, previous] = publicationTimes(feed)
  if (newest === undefined) return null
  return previous ?? newest - 1
}

/** The labels of the most frequent areas of a section, and how many others there are. */
export function topAreas(items: ChangelogFeedItem[], max = 3): { names: string[]; others: number } {
  const counts = new Map<string, number>()
  for (const { area } of items) {
    if (area !== null) counts.set(area, (counts.get(area) ?? 0) + 1)
  }
  const names = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  return { names: names.slice(0, max), others: Math.max(names.length - max, 0) }
}

/**
 * Groups feed items by type (ADR 0040): in the JSON's `types` order, entries without a type (written
 * before types existed) last.
 */
export function groupChangelogItems(
  data: GlobalChangelog,
  items: ChangelogFeedItem[],
  locale: string
): ChangelogGroup[] {
  const lang = readerLang(locale)

  return [...Object.keys(data.types), null].flatMap((type): ChangelogGroup[] => {
    const entries = items.filter((item) => item.type === type)
    if (entries.length === 0) return []
    const label = type === null ? null : (data.types[type]?.[lang] ?? type)
    return [{ type, label, entries }]
  })
}
