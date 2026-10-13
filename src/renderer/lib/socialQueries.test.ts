import { describe, expect, it } from 'vitest'
import { errorCode, socialKeys, statusForError, unwrap } from './socialQueries'
import { SocialStoreError } from './socialErrors'

describe('socialQueries', () => {
  it('scopes every key by environment', () => {
    expect(socialKeys.player('universe', 'p1').slice(0, 2)).toEqual(socialKeys.env('universe'))
    expect(socialKeys.snapshot('universe')).not.toEqual(socialKeys.snapshot('universe-testing'))
  })

  it('unwraps a result or throws its code', () => {
    expect(unwrap({ ok: true, data: 3 })).toBe(3)
    expect(() => unwrap({ ok: false, error: 'sanctioned' })).toThrow(SocialStoreError)
  })

  it('reads the code of an error', () => {
    expect(errorCode(new SocialStoreError('blocked'))).toBe('blocked')
    expect(errorCode(new Error('boom'))).toBe('unknown')
  })

  it.each([
    ['unavailable', 'unavailable'],
    ['notSignedIn', 'notSignedIn'],
    ['sessionExpired', 'notSignedIn'],
    ['sanctioned', 'error']
  ] as const)('shows %s as %s', (code, status) => {
    expect(statusForError(code)).toBe(status)
  })
})
