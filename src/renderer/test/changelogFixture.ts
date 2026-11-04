import type { ChangelogItem, GlobalChangelog } from '@shared/types/changelog'

/** A changelog item, written before types and areas when they are omitted. */
export function item(
  text: string,
  type: string | null = null,
  area: string | null = null
): ChangelogItem {
  return { type, area, text }
}

/** A changelog whose only build, on Universe Testing, holds `count` entries. */
export function changelogWithEntries(count: number): GlobalChangelog {
  const fixture = changelogFixture()
  return changelogFixture({
    DyingStar: {
      ...fixture.components.DyingStar!,
      releases: [
        {
          version: '0.1.0-dev.202610141000',
          date: '2026-10-14',
          yanked: false,
          dev: true,
          url: null,
          entries: {
            en: Array.from({ length: count }, (_, i) => item(`Entry ${i + 1}`, 'added')),
            fr: []
          }
        }
      ]
    }
  })
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
