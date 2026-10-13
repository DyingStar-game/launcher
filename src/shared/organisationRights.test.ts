import { describe, expect, it } from 'vitest'
import { assignableRanks, can, canActOn, canManage } from './organisationRights'

describe('can', () => {
  it('grants a permission the rank lists', () => {
    expect(can({ isCeo: false, permissions: ['recruit'] }, 'recruit')).toBe(true)
    expect(can({ isCeo: false, permissions: ['recruit'] }, 'manage_members')).toBe(false)
  })

  it('grants everything to the CEO', () => {
    expect(can({ isCeo: true, permissions: [] }, 'manage_ranks')).toBe(true)
  })
})

const officer = { isCeo: false, permissions: ['manage_members'], priority: 50 }

describe('canManage', () => {
  it('is any of the five permissions, or the CEO', () => {
    expect(canManage(officer)).toBe(true)
    expect(canManage({ isCeo: false, permissions: ['market:trade'] })).toBe(false)
    expect(canManage({ isCeo: true, permissions: [] })).toBe(true)
  })
})

describe('canActOn', () => {
  it('acts only strictly below, never on the CEO', () => {
    expect(canActOn(officer, { priority: 10, isCeo: false })).toBe(true)
    expect(canActOn(officer, { priority: 50, isCeo: false })).toBe(false)
    expect(canActOn({ ...officer, isCeo: true, priority: 99 }, { priority: 99, isCeo: true })).toBe(
      false
    )
  })
})

describe('assignableRanks', () => {
  it("keeps the non-CEO ranks below the member's own", () => {
    const ranks = [
      { id: 1, priority: 99, isCeo: true },
      { id: 2, priority: 50, isCeo: false },
      { id: 3, priority: 10, isCeo: false }
    ]
    expect(assignableRanks(officer, ranks).map((r) => r.id)).toEqual([3])
  })
})
