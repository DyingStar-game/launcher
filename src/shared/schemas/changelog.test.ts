import { describe, expect, it } from 'vitest'
import { globalChangelogSchema } from './changelog'

describe('globalChangelogSchema', () => {
  it('reads a global.json of schema version 2', () => {
    const data = {
      schema_version: 2,
      generated_at: '2026-10-14T00:00:00+00:00',
      types: { fixed: { en: 'Fixed', fr: 'Corrections' } },
      components: {
        launcher: {
          repo: 'DyingStar-game/launcher',
          areas: { download: { en: 'Download and install', fr: 'Téléchargement et installation' } },
          unreleased: {
            url: null,
            entries: { en: [{ type: 'fixed', area: 'download', text: 'a' }], fr: [] }
          },
          releases: [
            {
              version: '1.0.0',
              date: '2026-10-13',
              yanked: true,
              url: 'https://github.com/DyingStar-game/launcher/compare/v0.4.0...v1.0.0',
              entries: {
                en: [{ type: null, area: null, text: 'b' }],
                fr: [{ type: null, area: null, text: 'c' }]
              }
            }
          ]
        }
      }
    }
    expect(globalChangelogSchema.parse(data)).toEqual(data)
  })

  it('refuses the schema version 1 (entries as strings, no schema_version)', () => {
    const v1 = {
      generated_at: '2026-10-13T00:00:00+00:00',
      components: {
        launcher: { unreleased: { en: ['a'], fr: [] }, releases: [] }
      }
    }
    expect(globalChangelogSchema.safeParse(v1).success).toBe(false)
  })
})
