import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { Env } from '@shared/types/env'
import type {
  CreateOrganisationInput,
  OrganisationPatch,
  ProfilePatch,
  RankInput
} from '@shared/schemas/social'
import type {
  FriendRequestOutcome,
  InviteOutcome,
  JoinOutcome,
  SocialResult
} from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { socialKeys, unwrap } from '@lib/socialQueries'

/**
 * A social action on the active environment (ADR 0025): throws the error code on failure, and
 * resolves once the environment's social data is reloaded, so what shows follows the action.
 */
function useSocialAction<V, R>(
  run: (env: Env, variables: V) => Promise<SocialResult<R>>
): UseMutationResult<R, Error, V> {
  const env = useEnvStore((s) => s.activeEnv)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: V) => unwrap(await run(env, variables)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: socialKeys.env(env) })
  })
}

/** Sends a friend request; resolves to whether it was accepted at once. */
export const useSendFriendRequest = (): UseMutationResult<FriendRequestOutcome, Error, string> =>
  useSocialAction((env, playerId: string) => window.api.socialSendFriendRequest(env, playerId))

/** Accepts an incoming friend request. */
export const useAcceptFriendRequest = (): UseMutationResult<void, Error, number> =>
  useSocialAction((env, requestId: number) => window.api.socialAcceptRequest(env, requestId))

/** Declines an incoming friend request, or cancels an outgoing one. */
export const useDeclineFriendRequest = (): UseMutationResult<void, Error, number> =>
  useSocialAction((env, requestId: number) => window.api.socialDeclineRequest(env, requestId))

/** Joins an open organisation, or applies to one. */
export const useJoinOrganisation = (): UseMutationResult<JoinOutcome, Error, string> =>
  useSocialAction((env, id: string) => window.api.socialJoinOrganisation(env, id))

/** Creates an organisation; the player becomes its CEO. */
export const useCreateOrganisation = (): UseMutationResult<void, Error, CreateOrganisationInput> =>
  useSocialAction((env, input: CreateOrganisationInput) =>
    window.api.socialCreateOrganisation(env, input)
  )

/** Accepts or declines an invitation, or withdraws an application (`accept` false). */
export const useAnswerInvitation = (): UseMutationResult<
  void,
  Error,
  { requestId: number; accept: boolean }
> =>
  useSocialAction((env, { requestId, accept }: { requestId: number; accept: boolean }) =>
    window.api.socialAnswerOrganisationInvitation(env, requestId, accept)
  )

/** Accepts or declines an application received by an organisation (ADR 0024). */
export const useAnswerApplication = (): UseMutationResult<
  void,
  Error,
  { organisationId: string; requestId: number; accept: boolean }
> =>
  useSocialAction((env, v: { organisationId: string; requestId: number; accept: boolean }) =>
    window.api.socialAnswerOrganisationRequest(env, v.organisationId, v.requestId, v.accept)
  )

/** Updates the player's own profile texts (ADR 0020). */
export const useUpdateProfile = (): UseMutationResult<void, Error, ProfilePatch> =>
  useSocialAction((env, patch: ProfilePatch) => window.api.socialUpdateProfile(env, patch))

/** Edits an organisation's details (ADR 0021). */
export const useUpdateOrganisation = (
  organisationId: string
): UseMutationResult<void, Error, OrganisationPatch> =>
  useSocialAction((env, patch: OrganisationPatch) =>
    window.api.socialUpdateOrganisation(env, organisationId, patch)
  )

/** Invites a player to an organisation (ADR 0021). */
export const useInviteToOrganisation = (): UseMutationResult<
  InviteOutcome,
  Error,
  { organisationId: string; playerId: string }
> =>
  useSocialAction((env, v: { organisationId: string; playerId: string }) =>
    window.api.socialInviteToOrganisation(env, v.organisationId, v.playerId)
  )

/** Gives a member another rank (ADR 0021). */
export const useSetMemberRank = (
  organisationId: string
): UseMutationResult<void, Error, { playerId: string; rankId: number }> =>
  useSocialAction((env, v: { playerId: string; rankId: number }) =>
    window.api.socialSetMemberRank(env, organisationId, v.playerId, v.rankId)
  )

/** Removes a member, or leaves with the player's own id (ADR 0021). */
export const useRemoveMember = (organisationId: string): UseMutationResult<void, Error, string> =>
  useSocialAction((env, playerId: string) =>
    window.api.socialRemoveMember(env, organisationId, playerId)
  )

/** Creates a rank (ADR 0021). */
export const useCreateRank = (organisationId: string): UseMutationResult<void, Error, RankInput> =>
  useSocialAction((env, rank: RankInput) => window.api.socialCreateRank(env, organisationId, rank))

/** Edits a rank (ADR 0021). */
export const useUpdateRank = (
  organisationId: string
): UseMutationResult<void, Error, { rankId: number; rank: RankInput }> =>
  useSocialAction((env, v: { rankId: number; rank: RankInput }) =>
    window.api.socialUpdateRank(env, organisationId, v.rankId, v.rank)
  )

/** Deletes a rank (ADR 0021). */
export const useDeleteRank = (organisationId: string): UseMutationResult<void, Error, number> =>
  useSocialAction((env, rankId: number) => window.api.socialDeleteRank(env, organisationId, rankId))

/** Hands the leadership to a member (ADR 0021). */
export const useTransferOrganisation = (
  organisationId: string
): UseMutationResult<void, Error, string> =>
  useSocialAction((env, playerId: string) =>
    window.api.socialTransferOrganisation(env, organisationId, playerId)
  )

/** Disbands an organisation (ADR 0021). */
export const useDisbandOrganisation = (
  organisationId: string
): UseMutationResult<void, Error, void> =>
  useSocialAction((env) => window.api.socialDisbandOrganisation(env, organisationId))
