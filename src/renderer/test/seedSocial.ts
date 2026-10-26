import { act } from '@testing-library/react'
import { vi } from 'vitest'
import type { Env } from '@shared/types/env'
import type {
  Membership,
  OrganisationRank,
  OrganisationRequest,
  SocialSnapshot
} from '@shared/types/social'
import { useEnvStore } from '@stores/env'

/**
 * Makes `env` (default `universe-testing`) the active environment and `window.api.socialLoad`
 * answer with this social data (ADR 0025), `socialLoadFriends` with its friends (ADR 0045):
 * components load it through their queries.
 */
export function seedSocial(snapshot: Partial<SocialSnapshot>, env: Env = 'universe-testing'): void {
  const full: SocialSnapshot = {
    selfId: 'me',
    friends: [],
    incoming: [],
    outgoing: [],
    memberships: [],
    invitations: [],
    applications: [],
    receivedApplications: [],
    ...snapshot
  }
  vi.mocked(window.api.socialLoad).mockResolvedValue({ ok: true, data: full })
  vi.mocked(window.api.socialLoadFriends).mockResolvedValue({ ok: true, data: full.friends })
  act(() => useEnvStore.setState({ activeEnv: env }))
}

/** A rank for tests: a plain member by default. */
export function rank(patch: Partial<OrganisationRank> = {}): OrganisationRank {
  return {
    id: 3,
    name: 'Member',
    priority: 10,
    permissions: [],
    isCeo: false,
    isDefault: true,
    ...patch
  }
}

/** A membership for tests: organisation `c1` "Nova" (NOVA) with a plain member rank. */
export function membership(patch: Partial<Membership> = {}): Membership {
  return { id: 'c1', name: 'Nova', ticker: 'NOVA', recruitment: 'open', rank: rank(), ...patch }
}

/** A pending invitation or application for tests, on organisation `organisationId`. */
export function organisationRequest(
  id: number,
  organisationId = 'c1',
  name = 'Nova'
): OrganisationRequest {
  return { id, organisation: { id: organisationId, name, ticker: name.slice(0, 4).toUpperCase() } }
}
