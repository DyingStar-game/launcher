import { describe, expect, it } from 'vitest'
import {
  createOrganisationSchema,
  profileFormSchema,
  profilePatchSchema,
  toProfilePatch,
  type ProfileForm
} from './social'

describe('createOrganisationSchema', () => {
  it('trims the name and upper-cases the ticker', () => {
    expect(createOrganisationSchema.parse({ name: '  Nova Corp ', ticker: ' nova ' })).toEqual({
      name: 'Nova Corp',
      ticker: 'NOVA'
    })
  })

  it.each([
    [{ name: 'No', ticker: 'NOVA' }, 'name', 'forms.errors.organisationName'],
    [{ name: 'x'.repeat(49), ticker: 'NOVA' }, 'name', 'forms.errors.organisationName'],
    [{ name: 'Nova Corp', ticker: 'N' }, 'ticker', 'forms.errors.organisationTicker'],
    [{ name: 'Nova Corp', ticker: 'NOVA12' }, 'ticker', 'forms.errors.organisationTicker'],
    [{ name: 'Nova Corp', ticker: 'NO-V' }, 'ticker', 'forms.errors.organisationTicker']
  ])('rejects %o on %s', (input, field, message) => {
    const result = createOrganisationSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual([expect.objectContaining({ path: [field], message })])
  })
})

const empty: ProfileForm = {
  faction: '',
  biography: '',
  characterName: '',
  alignment: '',
  story: ''
}

describe('profileFormSchema', () => {
  it('accepts empty fields and caps each text', () => {
    expect(profileFormSchema.safeParse(empty).success).toBe(true)
    const result = profileFormSchema.safeParse({ ...empty, alignment: 'x'.repeat(33) })
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['alignment'], message: 'forms.errors.alignment' })
    ])
  })
})

describe('toProfilePatch', () => {
  const initial: ProfileForm = {
    ...empty,
    faction: 'Traders',
    characterName: 'Kira',
    story: 'Long'
  }

  it('sends only what changed', () => {
    expect(toProfilePatch(initial, { ...initial, biography: ' Hello ' })).toEqual({
      biography: 'Hello'
    })
    expect(toProfilePatch(initial, initial)).toEqual({})
  })

  it('clears an emptied text', () => {
    expect(toProfilePatch(initial, { ...initial, faction: '  ' })).toEqual({ faction: null })
  })

  it('sends the whole role-play sheet when one of its fields changed', () => {
    expect(toProfilePatch(initial, { ...initial, alignment: 'Neutral' })).toEqual({
      rpSheet: { characterName: 'Kira', alignment: 'Neutral', story: 'Long' }
    })
  })

  it('clears the role-play sheet when all its fields are emptied', () => {
    expect(toProfilePatch(initial, { ...initial, characterName: '', story: '' })).toEqual({
      rpSheet: null
    })
  })
})

describe('profilePatchSchema', () => {
  it('refuses an empty patch and unknown fields are dropped', () => {
    expect(profilePatchSchema.safeParse({}).success).toBe(false)
    expect(profilePatchSchema.parse({ faction: null, displayName: 'Hacker' })).toEqual({
      faction: null
    })
  })
})
