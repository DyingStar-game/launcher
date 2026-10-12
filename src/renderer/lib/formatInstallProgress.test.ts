import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatInstallProgress'

describe('formatBytes', () => {
  it.each([
    [512, '512 B'],
    [1536, '1.5 KB'],
    [5 * 1024 ** 2, '5.0 MB'],
    [14.2 * 1024 ** 3, '14.2 GB']
  ])('formats %d bytes as %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text)
  })
})
