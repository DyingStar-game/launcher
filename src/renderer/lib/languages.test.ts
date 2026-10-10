import { describe, expect, it } from 'vitest'
import { currentLanguage } from './languages'

describe('currentLanguage', () => {
  it('maps the resolved language onto an offered one', () => {
    expect(currentLanguage({ resolvedLanguage: 'fr', language: 'fr-FR' })).toBe('fr')
    expect(currentLanguage({ language: 'fr-CA' })).toBe('fr')
    expect(currentLanguage({ resolvedLanguage: 'en', language: 'de' })).toBe('en')
  })
})
