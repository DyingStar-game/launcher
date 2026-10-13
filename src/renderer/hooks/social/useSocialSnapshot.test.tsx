import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '../../test/render'
import { useAccountStore } from '@stores/account'
import { seedSocial } from '../../test/seedSocial'
import { useSocialAccountSync, useSocialSnapshot } from './useSocialSnapshot'

const savedAccount = useAccountStore.getState()

/** The testing environment's account. */
function account(status: 'connected' | 'disconnected'): void {
  act(() =>
    useAccountStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { status, sessionExpired: false } }
    }))
  )
}

afterEach(() => act(() => useAccountStore.setState(savedAccount, true)))

describe('useSocialAccountSync', () => {
  it('drops the friends of a player who signs out', async () => {
    account('connected')
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'online' }] })
    const { result } = renderHook(() => {
      useSocialAccountSync('universe-testing')
      return useSocialSnapshot()
    })
    await waitFor(() => expect(result.current.data.friends).toHaveLength(1))

    vi.mocked(window.api.socialLoad).mockResolvedValue({ ok: false, error: 'notSignedIn' })
    account('disconnected')
    await waitFor(() => expect(result.current.status).toBe('notSignedIn'))
    expect(result.current.data.friends).toEqual([])
  })
})
