import { ipcMain, type BrowserWindow } from 'electron'
import type { Env } from '@shared/types/env'
import type { UserInfo } from '@shared/types/auth'
import { loadUserProfile, logout, setAuthEventSender, startLogin } from './flow'

/** Registers IPC handlers for authentication (login, logout, load user). */
export function registerAuthHandlers(win: BrowserWindow): void {
  setAuthEventSender(win.webContents)

  ipcMain.handle('auth:login', async (_event, env: Env) => {
    try {
      await startLogin(env)
    } catch (err) {
      console.error('[Auth] Failed to open browser:', err)
      win.webContents.send('auth:state-changed', {
        env,
        status: 'error',
        error: 'browser_open_failed'
      })
    }
  })

  ipcMain.handle('auth:logout', (_event, env: Env) => {
    logout(env)
  })

  ipcMain.handle('auth:load-user', async (_event, env: Env): Promise<UserInfo | null> => {
    return loadUserProfile(env)
  })
}
