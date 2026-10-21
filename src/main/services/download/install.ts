import * as fs from 'fs'
import * as path from 'path'
import type { BrowserWindow } from 'electron'
import { GAME_INSTALL_SUBDIR } from '../../config/constants'
import type { Env } from '@shared/types/env'
import type { InstallOutcome } from '@shared/types/install'
import { downloadZip } from './zipFetch'
import { extractZip } from './extract'
import { resolveInstalledVersion } from './manifest'
import { sendProgress } from './progress'
import { deletePartialDownload, fileSize, partialZipPath, readDownloadMeta } from './partial'
import {
  gameFilesSize,
  listArchiveFiles,
  readGameFiles,
  removeGameFiles,
  writeGameFiles
} from './gameFiles'
import { DiskFullError, freeBytes, isNoSpace } from './disk'

/** Why a download was stopped by the player (ADR 0036). */
type StopReason = 'paused' | 'cancelled'

/** Installs running, per environment: their download can be stopped until extraction starts. */
const running = new Map<Env, { controller: AbortController; extracting: boolean }>()

/** Pauses the environment's download, keeping what was received; false once extracting. */
export function pauseInstall(env: Env): boolean {
  const install = running.get(env)
  if (!install || install.extracting) return false
  install.controller.abort('paused' satisfies StopReason)
  return true
}

/**
 * Cancels the environment's download, or removes a paused one from the install folder; false once
 * extracting (the game folder is being replaced).
 */
export function cancelInstall(env: Env, installPath: string): boolean {
  const install = running.get(env)
  if (install) {
    if (install.extracting) return false
    install.controller.abort('cancelled' satisfies StopReason)
    return true
  }
  deletePartialDownload(installPath)
  return true
}

type DiskFull = Extract<InstallOutcome, { status: 'diskFull' }>

/** The lack of space a download failure means, or null when it is another failure (ADR 0047). */
async function downloadDiskFull(err: unknown, installPath: string): Promise<DiskFull | null> {
  if (err instanceof DiskFullError) {
    return { status: 'diskFull', needed: err.needed, available: err.available }
  }
  if (!isNoSpace(err)) return null
  const total = readDownloadMeta(installPath)?.total ?? 0
  const missing = Math.max(0, total - fileSize(partialZipPath(installPath)))
  return { status: 'diskFull', needed: missing, available: await freeBytes(installPath) }
}

/**
 * Downloads the game ZIP (resuming a partial one), extracts it, and returns the installed version
 * info, or how the player stopped it. The installed game is only replaced once the ZIP is complete
 * and its files fit on the disk; a lack of space keeps the ZIP, to resume (ADR 0047).
 */
export async function downloadAndInstall(
  env: Env,
  installPath: string,
  win: BrowserWindow
): Promise<InstallOutcome> {
  if (running.has(env)) throw new Error(`An install is already running for ${env}.`)
  if (!fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true })
  }

  const install = { controller: new AbortController(), extracting: false }
  running.set(env, install)
  try {
    let zipFilePath: string
    try {
      zipFilePath = await downloadZip(env, installPath, win, install.controller.signal)
    } catch (err) {
      const { signal } = install.controller
      if (!signal.aborted) {
        // Kept on disk: the download can be resumed
        const diskFull = await downloadDiskFull(err, installPath)
        if (diskFull) return diskFull
        throw err
      }
      if ((signal.reason as StopReason) === 'cancelled') {
        deletePartialDownload(installPath)
        return { status: 'cancelled' }
      }
      return { status: 'paused' }
    }

    install.extracting = true
    const gameRoot = path.join(installPath, GAME_INSTALL_SUBDIR)
    let archive: Awaited<ReturnType<typeof listArchiveFiles>> | null = null
    let installedFiles: string[] = []
    try {
      sendProgress(win, 68, { key: 'preparing' })
      archive = await listArchiveFiles(zipFilePath)
      const archiveFiles = archive.files
      installedFiles = readGameFiles(gameRoot) ?? []
      // The new files must fit once the previous ones are removed, checked before removing any:
      // the installed game stays playable (ADR 0047)
      const needed = archive.size - gameFilesSize(gameRoot, installedFiles)
      const available = await freeBytes(installPath)
      if (available < needed) return { status: 'diskFull', needed, available }

      // Only the files a previous archive installed go: the player's own stay (ADR 0038)
      writeGameFiles(gameRoot, [...installedFiles, ...archiveFiles])
      removeGameFiles(gameRoot, installedFiles)
      fs.mkdirSync(gameRoot, { recursive: true })

      await extractZip(zipFilePath, gameRoot, win)
      writeGameFiles(gameRoot, archiveFiles)
      sendProgress(win, 99, { key: 'cleaning' })
      deletePartialDownload(installPath)
      const manifest = await resolveInstalledVersion(env, gameRoot)
      if (!manifest) {
        throw new Error('Installation finished but version.json was not found in the game folder.')
      }
      sendProgress(win, 100, { key: 'completeInstall', version: manifest.version })
      return { status: 'installed', ...manifest }
    } catch (err) {
      if (archive && isNoSpace(err)) {
        // The ZIP stays: Resume removes what was extracted and extracts again
        const toRemove = gameFilesSize(gameRoot, [...installedFiles, ...archive.files])
        return {
          status: 'diskFull',
          needed: Math.max(0, archive.size - toRemove),
          available: await freeBytes(installPath)
        }
      }
      deletePartialDownload(installPath)
      throw err
    }
  } finally {
    running.delete(env)
  }
}
