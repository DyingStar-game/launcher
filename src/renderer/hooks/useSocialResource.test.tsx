import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SocialStoreError } from '@lib/socialErrors'
import { useSocialResource } from './useSocialResource'

const a = { id: 'a', env: 'universe-testing' as const }
const b = { id: 'b', env: 'universe-testing' as const }

describe('useSocialResource', () => {
  it('loads the subject', async () => {
    const { result } = renderHook(() => useSocialResource(a, async (_env, id) => `data ${id}`))
    expect(result.current).toEqual({ kind: 'loading' })
    await waitFor(() => expect(result.current).toEqual({ kind: 'loaded', data: 'data a' }))
  })

  it('translates an error', async () => {
    const { result } = renderHook(() =>
      useSocialResource(a, async () => {
        throw new SocialStoreError('playerNotFound')
      })
    )
    await waitFor(() =>
      expect(result.current).toEqual({
        kind: 'error',
        message: 'No player with this exact username.'
      })
    )
  })

  it('ignores a late answer for the previous subject', async () => {
    let releaseA: (value: string) => void = () => {}
    const load = (_env: string, id: string): Promise<string> =>
      id === 'a' ? new Promise((resolve) => (releaseA = resolve)) : Promise.resolve('data b')
    const { result, rerender } = renderHook(({ subject }) => useSocialResource(subject, load), {
      initialProps: { subject: a }
    })
    rerender({ subject: b })
    await waitFor(() => expect(result.current).toEqual({ kind: 'loaded', data: 'data b' }))
    releaseA('data a')
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current).toEqual({ kind: 'loaded', data: 'data b' })
  })
})
