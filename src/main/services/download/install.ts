import * as fs from 'fs'
import * as path from 'path'
import type { BrowserWindow } from 'electron'
import { GAME_INSTALL_SUBDIR } from '../../config/constants'
import type { Env } from '@shared/types/env'
import type { InstallResult } from '@shared/types/install'
import { downloadZip } from './zipFetch'
import { extractZip } from './extract'
import { resolveInstalledVersion } from './manifest'
import { sendProgress } from './progress'

/** Downloads the game ZIP, extracts it, and returns the installed version info. */
export async function downloadAndInstall(
  env: Env,
  installPath: string,
  win: BrowserWindow
): Promise<InstallResult> {
  if (!fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true })
  }

  let zipFilePath: string | null = null
  try {
    zipFilePath = await downloadZip(env, installPath, win)

    const gameRoot = path.join(installPath, GAME_INSTALL_SUBDIR)
    sendProgress(win, 68, { key: 'preparing' })
    if (fs.existsSync(gameRoot)) {
      fs.rmSync(gameRoot, { recursive: true, force: true })
    }
    fs.mkdirSync(gameRoot, { recursive: true })

    await extractZip(zipFilePath, gameRoot, win)
    sendProgress(win, 99, { key: 'cleaning' })
    fs.unlinkSync(zipFilePath)
    const manifest = await resolveInstalledVersion(env, gameRoot)
    if (!manifest) {
      throw new Error('Installation finished but version.json was not found in the game folder.')
    }
    sendProgress(win, 100, { key: 'completeInstall', version: manifest.version })
    return manifest
  } catch (err) {
    if (zipFilePath && fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath)
    throw err
  }
}
