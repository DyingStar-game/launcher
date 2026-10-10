import { useQueries } from '@tanstack/react-query'
import type { Membership, PlayerProfile } from '@shared/types/social'
import { can } from '@shared/organisationRights'
import { useEnvStore } from '@stores/env'
import { socialKeys, unwrap } from '@lib/socialQueries'
import { useSocialSnapshot } from './useSocialSnapshot'

/** The player's organisations that may invite someone, split by whether they already did. */
export type InvitationTargets = {
  /** Organisations that may invite them and have not yet. */
  invitable: Membership[]
  /** Organisations that already invited them, awaiting their answer. */
  invited: Membership[]
  /** The invitations sent are not known yet: offer nothing until they are. */
  pending: boolean
}

/**
 * Where the player may invite someone (ADR 0021): organisations whose rank holds `invite`, that
 * the person is not in, and that have not invited them already — read from each organisation's
 * pending requests (the same queries as the management page's Invitations tab, ADR 0025).
 */
export function useInvitationTargets(player: PlayerProfile): InvitationTargets {
  const env = useEnvStore((s) => s.activeEnv)
  const { data } = useSocialSnapshot()
  const candidates = data.memberships.filter(
    (m) => can(m.rank, 'invite') && !player.corporations.some((c) => c.id === m.id)
  )
  const requests = useQueries({
    queries: candidates.map((m) => ({
      queryKey: socialKeys.requests(env, m.id),
      queryFn: async () => unwrap(await window.api.socialGetOrganisationRequests(env, m.id))
    }))
  })
  const invitedIds = new Set(
    candidates
      .filter((_, i) =>
        requests[i].data?.some((r) => r.kind === 'invitation' && r.player.id === player.id)
      )
      .map((m) => m.id)
  )
  return {
    invitable: candidates.filter((m) => !invitedIds.has(m.id)),
    invited: candidates.filter((m) => invitedIds.has(m.id)),
    pending: requests.some((r) => r.isPending)
  }
}
