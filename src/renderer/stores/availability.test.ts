import { afterEach, describe, expect, it, vi } from 'vitest'

const checkAuthAvailability = vi.fn<(env: string) => Promise<boolean>>()
const authLoadUser = vi.fn(() => Promise.resolve(null))
vi.stubGlobal('window', {
  api: { checkAuthAvailability, authLoadUser, onAuthStateChanged: vi.fn() }
})

const { useAvailabilityStore } = await import('./availability')
const { useAccountStore } = await import('./account')

const saved = useAvailabilityStore.getState()

afterEach(() => {
  useAvailabilityStore.setState(saved, true)
  vi.clearAllMocks()
})

describe('availability store', () => {
  it('turns sign-in off while the status page reports its server down', async () => {
    checkAuthAvailability.mockResolvedValue(false)
    await useAvailabilityStore.getState().checkAuthAvailability('universe-testing')
    expect(useAvailabilityStore.getState().authAvailable).toEqual({
      universe: true,
      'universe-testing': false
    })
  })

  it('restores the kept session once the sign-in server is back', async () => {
    checkAuthAvailability.mockResolvedValue(false)
    await useAvailabilityStore.getState().checkAuthAvailability('universe-testing')
    authLoadUser.mockClear()

    checkAuthAvailability.mockResolvedValue(true)
    await useAvailabilityStore.getState().checkAuthAvailability('universe-testing')
    expect(useAvailabilityStore.getState().authAvailable['universe-testing']).toBe(true)
    expect(authLoadUser).toHaveBeenCalledExactlyOnceWith('universe-testing')
  })

  it('does not restore the session of a player still signed in', async () => {
    useAccountStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { status: 'connected', username: 'Kira' } }
    }))
    checkAuthAvailability.mockResolvedValue(false)
    await useAvailabilityStore.getState().checkAuthAvailability('universe-testing')
    authLoadUser.mockClear()

    checkAuthAvailability.mockResolvedValue(true)
    await useAvailabilityStore.getState().checkAuthAvailability('universe-testing')
    expect(authLoadUser).not.toHaveBeenCalled()
  })
})
