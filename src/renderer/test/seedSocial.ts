import { act } from '@testing-library/react'
import { vi } from 'vitest'
import type { Env } from '@shared/types/env'
import type { SocialSnapshot } from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'

/**
 * Puts the social store of `env` (default `universe-testing`) in a ready state for a test, and
 * makes `window.api.socialLoad` (called after every action) answer with the same data.
 */
export function seedSocial(snapshot: Partial<SocialSnapshot>, env: Env = 'universe-testing'): void {
  const full: SocialSnapshot = {
    selfId: 'me',
    friends: [],
    incoming: [],
    outgoing: [],
    organisations: [],
    memberOf: [],
    appliedTo: [],
    ...snapshot
  }
  vi.mocked(window.api.socialLoad).mockResolvedValue({ ok: true, data: full })
  act(() => {
    useEnvStore.setState({ activeEnv: env })
    useSocialStore.setState((s) => ({
      data: {
        ...s.data,
        [env]: { ...full, orgaSearch: '', status: 'ready' }
      }
    }))
  })
}
