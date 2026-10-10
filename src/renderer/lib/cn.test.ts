import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('drops falsy values and merges conflicting utilities', () => {
    const hidden = false
    expect(cn('px-2 text-sm', hidden && 'hidden', 'px-4')).toBe('text-sm px-4')
  })

  it('lets a later display utility win over an earlier one', () => {
    expect(cn('inline-flex', 'hidden')).toBe('hidden')
  })

  it('merges arbitrary-value colours', () => {
    expect(cn('text-[var(--color-ds-muted)]', 'text-red-300')).toBe('text-red-300')
  })
})
