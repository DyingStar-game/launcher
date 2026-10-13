import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { KEY_ART } from './keyArt'

describe('KEY_ART', () => {
  it('takes every WebP of assets/key-art, in file name order', () => {
    const files = readdirSync(join(__dirname, '../assets/key-art'))
      .filter((name) => name.endsWith('.webp'))
      .sort()
    expect(files.length).toBeGreaterThanOrEqual(1)
    expect(KEY_ART.map((url) => url.split('/').pop())).toEqual(files)
  })
})
