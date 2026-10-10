import { ipcMain } from 'electron'
import type { Env } from '@shared/types/env'
import {
  acceptFriendRequest,
  createOrganisation,
  declineFriendRequest,
  getOrganisation,
  getOrganisationMembers,
  getPlayer,
  joinOrganisation,
  loadSocial,
  removeFriend,
  searchPlayers,
  sendFriendRequest
} from './service'

/** Registers IPC handlers for the social page (ADR 0007); each resolves to a `SocialResult`. */
export function registerSocialHandlers(): void {
  ipcMain.removeHandler('social:load')
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

  ipcMain.handle('social:load', (_event, env: Env, search?: string) => loadSocial(env, search))
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
  ipcMain.handle('social:create-organisation', (_event, env: Env, name: string, ticker: string) =>
    createOrganisation(env, name, ticker)
  )
}
