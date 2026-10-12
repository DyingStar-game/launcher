import { describe, expect, it } from 'vitest'
import { KEY_ART } from './keyArt'

describe('KEY_ART', () => {
  it('takes every WebP of assets/key-art, in file name order', () => {
    expect(KEY_ART.length).toBeGreaterThanOrEqual(3)
    const names = KEY_ART.map((url) => url.split('/').pop())
    expect(names.slice(0, 3)).toEqual(['key-art-01.webp', 'key-art-02.webp', 'key-art-03.webp'])
  })
})
