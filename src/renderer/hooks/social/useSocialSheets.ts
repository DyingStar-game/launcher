import { useInfiniteQuery, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type {
  OrganisationMember,
  OrganisationPendingRequest,
  OrganisationProfile,
  OrganisationRank,
  PlayerProfile
} from '@shared/types/social'
import type { Subject } from '@stores/navigation'
import { getSocialErrorMessage } from '@lib/socialErrors'
import { socialKeys, unwrap } from '@lib/socialQueries'

/** State of a sheet loaded for a subject (ADR 0012). */
export type ResourceState<T> =
  { kind: 'loading' } | { kind: 'loaded'; data: T } | { kind: 'error'; message: string }

/** Maps a query to the sheet state, the error translated. */
function useResourceState<T>(query: UseQueryResult<T>): ResourceState<T> {
  const { t } = useTranslation()
  if (query.isError) return { kind: 'error', message: getSocialErrorMessage(query.error, t) }
  if (query.data === undefined) return { kind: 'loading' }
  return { kind: 'loaded', data: query.data }
}

/** A player's public sheet (ADR 0009, 0025). */
export function usePlayer(subject: Subject | null): ResourceState<PlayerProfile> {
  const query = useQuery({
    queryKey: socialKeys.player(subject?.env ?? 'universe', subject?.id ?? ''),
    queryFn: async () => unwrap(await window.api.socialGetPlayer(subject!.env, subject!.id)),
    enabled: subject !== null
  })
  return useResourceState(query)
}

/** An organisation's public sheet (ADR 0010, 0025). */
export function useOrganisation(subject: Subject | null): ResourceState<OrganisationProfile> {
  const query = useQuery({
    queryKey: socialKeys.organisation(subject?.env ?? 'universe', subject?.id ?? ''),
    queryFn: async () => unwrap(await window.api.socialGetOrganisation(subject!.env, subject!.id)),
    enabled: subject !== null
  })
  return useResourceState(query)
}

/** An organisation's members, 50 per page with "Load more" (ADR 0012, 0025). */
export function useOrganisationMembers(subject: Subject): {
  members: OrganisationMember[]
  total: number
  /** Nothing loaded yet. */
  pending: boolean
  error?: string
  loadMore: () => void
  loadingMore: boolean
} {
  const { t } = useTranslation()
  const query = useInfiniteQuery({
    queryKey: socialKeys.members(subject.env, subject.id),
    queryFn: async ({ pageParam }) =>
      unwrap(await window.api.socialGetOrganisationMembers(subject.env, subject.id, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.members.length, 0)
      return last.members.length > 0 && loaded < last.total ? loaded : undefined
    },
    // Back to an organisation brings back every page loaded (ADR 0013)
    gcTime: 30 * 60 * 1000
  })
  const pages = query.data?.pages ?? []
  return {
    members: pages.flatMap((p) => p.members),
    total: pages.at(-1)?.total ?? 0,
    pending: query.isPending,
    error: query.isError ? getSocialErrorMessage(query.error, t) : undefined,
    loadMore: () => void query.fetchNextPage(),
    loadingMore: query.isFetchingNextPage
  }
}

/** Pending applications and invitations of an organisation, for its managers (ADR 0021). */
export function useOrganisationRequests(
  subject: Subject,
  enabled = true
): ResourceState<OrganisationPendingRequest[]> {
  const query = useQuery({
    queryKey: socialKeys.requests(subject.env, subject.id),
    queryFn: async () =>
      unwrap(await window.api.socialGetOrganisationRequests(subject.env, subject.id)),
    enabled
  })
  return useResourceState(query)
}

/** An organisation's ranks, highest first (ADR 0021). */
export function useOrganisationRanks(subject: Subject): ResourceState<OrganisationRank[]> {
  const query = useQuery({
    queryKey: socialKeys.ranks(subject.env, subject.id),
    queryFn: async () =>
      unwrap(await window.api.socialGetOrganisationRanks(subject.env, subject.id))
  })
  return useResourceState(query)
}
