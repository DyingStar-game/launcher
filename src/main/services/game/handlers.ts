import { dialog, ipcMain, type BrowserWindow } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { downloadAndInstall } from '../download'
import { resolveInstalledVersion } from '../download/manifest'
import { clearDyingStarGodotCaches } from '../godotUserdataCache'
import type { Env } from '@shared/types/env'
import { findChangelogPath, getGameRoot, isGameInstalledAtPath } from './paths'
import { launchGame } from './launch'
import { isGameRunning, setLauncherWindow } from './processWatch'
import { getInstallDialogStrings } from '../../l10n/dialogs'

/** Registers IPC handlers for install paths, changelog, cache, and game launch. */
export function registerFilesHandlers(win: BrowserWindow): void {
  setLauncherWindow(win)

  ipcMain.removeHandler('files:select-directory')
  ipcMain.handle('files:select-directory', async () => {
    const dialogStrings = getInstallDialogStrings()
    const result = await dialog.showOpenDialog(win, {
      title: dialogStrings.selectDirectoryTitle,
      buttonLabel: dialogStrings.selectDirectoryButton,
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.removeHandler('files:install')
  ipcMain.handle('files:install', async (_event, env: Env, installPath: string) => {
    if (!installPath || typeof installPath !== 'string') {
      throw new Error('Invalid installation path.')
    }
    return downloadAndInstall(env, installPath, win)
  })

  ipcMain.removeHandler('game:launch')
  ipcMain.removeHandler('game:is-running')
  ipcMain.removeHandler('files:clear-godot-cache')
  ipcMain.handle('files:clear-godot-cache', async () => clearDyingStarGodotCaches())

  ipcMain.removeHandler('files:read-changelog')
  ipcMain.removeHandler('files:resolve-installed-version')

  ipcMain.handle(
    'files:read-changelog',
    async (_event, installPath: string): Promise<string | null> => {
      if (!installPath || typeof installPath !== 'string') return null
      const changelogFile = findChangelogPath(path.resolve(installPath))
      if (!changelogFile) return null
      try {
        return fs.readFileSync(changelogFile, 'utf-8')
      } catch {
        return null
      }
    }
  )

  ipcMain.handle(
    'files:resolve-installed-version',
    async (
      _event,
      env: Env,
      installPath: string
    ): Promise<{ version: string; releaseDate: string } | null> => {
      if (!installPath || typeof installPath !== 'string') return null
      const resolvedPath = path.resolve(installPath)
      if (!isGameInstalledAtPath(resolvedPath)) return null
      const gameRoot = getGameRoot(resolvedPath)
      if (!fs.existsSync(gameRoot)) return null
      return resolveInstalledVersion(env, gameRoot)
    }
  )

  ipcMain.handle('game:launch', async (_event, env: Env, installPath: string) => {
    await launchGame(installPath, env)
  })

  ipcMain.handle('game:is-running', () => isGameRunning())
}
