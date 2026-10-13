import { describe, expect, it } from 'vitest'
import type { ControllerFieldState } from 'react-hook-form'
import { fieldError } from './formErrors'

const state = (patch: Partial<ControllerFieldState>): ControllerFieldState => ({
  invalid: false,
  isTouched: false,
  isDirty: false,
  isValidating: false,
  ...patch
})
const translate = (key: string): string => `t:${key}`

describe('fieldError', () => {
  it('translates the message of a changed field', () => {
    const error = { type: 'too_small', message: 'forms.errors.organisationName' }
    expect(fieldError(state({ isDirty: true, invalid: true, error }), translate)).toBe(
      't:forms.errors.organisationName'
    )
  })

  it('stays silent on an untouched or valid field', () => {
    const error = { type: 'too_small', message: 'forms.errors.organisationName' }
    expect(fieldError(state({ invalid: true, error }), translate)).toBeUndefined()
    expect(fieldError(state({ isDirty: true }), translate)).toBeUndefined()
  })
})
