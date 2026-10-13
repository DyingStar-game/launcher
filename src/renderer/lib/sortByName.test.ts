import { describe, expect, it } from 'vitest'
import { sortByName } from './sortByName'

const names = (items: { name: string }[]): string[] => items.map(({ name }) => name)

describe('sortByName', () => {
  it('sorts alphabetically, ignoring case and accents', () => {
    const sorted = sortByName(
      [{ name: 'zed' }, { name: 'Émile' }, { name: 'anna' }, { name: 'Bob' }],
      'fr'
    )
    expect(names(sorted)).toEqual(['anna', 'Bob', 'Émile', 'zed'])
  })

  it('sorts numbers by value, without changing the list it is given', () => {
    const items = [{ name: 'Pilot 10' }, { name: 'Pilot 2' }]
    expect(names(sortByName(items, 'en'))).toEqual(['Pilot 2', 'Pilot 10'])
    expect(names(items)).toEqual(['Pilot 10', 'Pilot 2'])
  })
})
