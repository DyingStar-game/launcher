import type { ChangelogItem, GlobalChangelog } from '@shared/types/changelog'

/** A changelog item, written before types and areas when they are omitted. */
export function item(
  text: string,
  type: string | null = null,
  area: string | null = null
): ChangelogItem {
  return { type, area, text }
}

/**
 * A `global.json` (schema version 2, ADR 0040) with the DyingStar and launcher components; pass
 * `components` to replace their content.
 */
export function changelogFixture(
  components: Partial<GlobalChangelog['components']> = {}
): GlobalChangelog {
  const empty = { url: null, entries: { en: [], fr: [] } }
  return {
    schema_version: 2,
    generated_at: '2026-10-14T00:00:00+00:00',
    types: {
      added: { en: 'Added', fr: 'Ajouts' },
      changed: { en: 'Changed', fr: 'Modifications' },
      fixed: { en: 'Fixed', fr: 'Corrections' }
    },
    components: {
      DyingStar: {
        repo: 'DyingStar-game/DyingStar',
        areas: {
          vehicles: { en: 'Vehicles', fr: 'Véhicules' },
          ui: { en: 'Interface', fr: 'Interface' }
        },
        unreleased: empty,
        releases: []
      },
      launcher: {
        repo: 'DyingStar-game/launcher',
        areas: { download: { en: 'Download and install', fr: 'Téléchargement et installation' } },
        unreleased: empty,
        releases: []
      },
      ...components
    } as GlobalChangelog['components']
  }
}
