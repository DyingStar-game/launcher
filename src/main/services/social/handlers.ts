import { ipcMain } from 'electron'
import type { Env } from '@shared/types/env'
import {
  acceptFriendRequest,
  updateOrganisation,
  getOrganisationRequests,
  inviteToOrganisation,
  setMemberRank,
  removeMember,
  getOrganisationRanks,
  createRank,
  updateRank,
  deleteRank,
  transferOrganisation,
  disbandOrganisation,
  answerOrganisationInvitation,
  answerOrganisationRequest,
  createOrganisation,
  declineFriendRequest,
  getOrganisation,
  getOrganisationMembers,
  getPlayer,
  joinOrganisation,
  loadFriends,
  loadSocial,
  removeFriend,
  searchOrganisations,
  searchPlayers,
  updateProfile,
  sendFriendRequest
} from './service'

/** Registers IPC handlers for the social page (ADR 0007); each resolves to a `SocialResult`. */
export function registerSocialHandlers(): void {
  ipcMain.removeHandler('social:load')
  ipcMain.removeHandler('social:load-friends')
  ipcMain.removeHandler('social:search-players')
  ipcMain.removeHandler('social:get-player')
  ipcMain.removeHandler('social:get-organisation')
  ipcMain.removeHandler('social:get-organisation-members')
  ipcMain.removeHandler('social:send-friend-request')
  ipcMain.removeHandler('social:remove-friend')
  ipcMain.removeHandler('social:accept-request')
  ipcMain.removeHandler('social:decline-request')
  ipcMain.removeHandler('social:join-organisation')
  ipcMain.removeHandler('social:create-organisation')
  ipcMain.removeHandler('social:answer-organisation-invitation')
  ipcMain.removeHandler('social:search-organisations')
  ipcMain.removeHandler('social:answer-organisation-request')
  ipcMain.removeHandler('social:update-profile')
  ipcMain.removeHandler('social:update-organisation')
  ipcMain.removeHandler('social:get-organisation-requests')
  ipcMain.removeHandler('social:invite-to-organisation')
  ipcMain.removeHandler('social:set-member-rank')
  ipcMain.removeHandler('social:remove-member')
  ipcMain.removeHandler('social:get-organisation-ranks')
  ipcMain.removeHandler('social:create-rank')
  ipcMain.removeHandler('social:update-rank')
  ipcMain.removeHandler('social:delete-rank')
  ipcMain.removeHandler('social:transfer-organisation')
  ipcMain.removeHandler('social:disband-organisation')

  ipcMain.handle('social:load', (_event, env: Env) => loadSocial(env))
  ipcMain.handle('social:load-friends', (_event, env: Env) => loadFriends(env))
  ipcMain.handle('social:search-players', (_event, env: Env, query: string) =>
    searchPlayers(env, query)
  )
  ipcMain.handle('social:get-player', (_event, env: Env, playerId: string) =>
    getPlayer(env, playerId)
  )
  ipcMain.handle('social:get-organisation', (_event, env: Env, corporationId: string) =>
    getOrganisation(env, corporationId)
  )
  ipcMain.handle(
    'social:get-organisation-members',
    (_event, env: Env, corporationId: string, offset: number) =>
      getOrganisationMembers(env, corporationId, offset)
  )
  ipcMain.handle('social:send-friend-request', (_event, env: Env, playerId: string) =>
    sendFriendRequest(env, playerId)
  )
  ipcMain.handle('social:remove-friend', (_event, env: Env, playerId: string) =>
    removeFriend(env, playerId)
  )
  ipcMain.handle('social:accept-request', (_event, env: Env, requestId: number) =>
    acceptFriendRequest(env, requestId)
  )
  ipcMain.handle('social:decline-request', (_event, env: Env, requestId: number) =>
    declineFriendRequest(env, requestId)
  )
  ipcMain.handle('social:join-organisation', (_event, env: Env, corporationId: string) =>
    joinOrganisation(env, corporationId)
  )
  ipcMain.handle('social:create-organisation', (_event, env: Env, input: unknown) =>
    createOrganisation(env, input)
  )
  ipcMain.handle(
    'social:answer-organisation-invitation',
    (_event, env: Env, requestId: number, accept: boolean) =>
      answerOrganisationInvitation(env, requestId, accept)
  )
  ipcMain.handle('social:search-organisations', (_event, env: Env, query: string) =>
    searchOrganisations(env, query)
  )
  ipcMain.handle(
    'social:answer-organisation-request',
    (_event, env: Env, corporationId: string, requestId: number, accept: boolean) =>
      answerOrganisationRequest(env, corporationId, requestId, accept)
  )
  ipcMain.handle('social:update-profile', (_event, env: Env, patch: unknown) =>
    updateProfile(env, patch)
  )
  ipcMain.handle(
    'social:update-organisation',
    (_event, env: Env, corporationId: string, patch: unknown) =>
      updateOrganisation(env, corporationId, patch)
  )
  ipcMain.handle('social:get-organisation-requests', (_event, env: Env, corporationId: string) =>
    getOrganisationRequests(env, corporationId)
  )
  ipcMain.handle(
    'social:invite-to-organisation',
    (_event, env: Env, corporationId: string, playerId: string) =>
      inviteToOrganisation(env, corporationId, playerId)
  )
  ipcMain.handle(
    'social:set-member-rank',
    (_event, env: Env, corporationId: string, playerId: string, rankId: number) =>
      setMemberRank(env, corporationId, playerId, rankId)
  )
  ipcMain.handle(
    'social:remove-member',
    (_event, env: Env, corporationId: string, playerId: string) =>
      removeMember(env, corporationId, playerId)
  )
  ipcMain.handle('social:get-organisation-ranks', (_event, env: Env, corporationId: string) =>
    getOrganisationRanks(env, corporationId)
  )
  ipcMain.handle('social:create-rank', (_event, env: Env, corporationId: string, rank: unknown) =>
    createRank(env, corporationId, rank)
  )
  ipcMain.handle(
    'social:update-rank',
    (_event, env: Env, corporationId: string, rankId: number, rank: unknown) =>
      updateRank(env, corporationId, rankId, rank)
  )
  ipcMain.handle('social:delete-rank', (_event, env: Env, corporationId: string, rankId: number) =>
    deleteRank(env, corporationId, rankId)
  )
  ipcMain.handle(
    'social:transfer-organisation',
    (_event, env: Env, corporationId: string, playerId: string) =>
      transferOrganisation(env, corporationId, playerId)
  )
  ipcMain.handle('social:disband-organisation', (_event, env: Env, corporationId: string) =>
    disbandOrganisation(env, corporationId)
  )
}
