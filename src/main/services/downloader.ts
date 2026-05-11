import { BrowserWindow } from 'electron'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import extract from 'extract-zip'
import {
  getDownloadBase,
  getUniverseZipUrlForPlatform,
  getTestingZipUrlForPlatform,
  ENDPOINTS
} from '../config/env'
import type { Env } from '../../renderer/store/env'

/** Sous-dossier d’installation du payload du jeu (ZIP extrait ici, pas à la racine du chemin choisi). */
export const GAME_INSTALL_SUBDIR = 'DyingStar'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstallResult {
  version:     string
  releaseDate: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getZipUrl(env: Env): string {
  const platform = process.platform

  if (env === 'universe') {
    const direct = getUniverseZipUrlForPlatform(platform)
    if (direct) return direct
  }

  if (env === 'universe-testing') {
    const direct = getTestingZipUrlForPlatform(platform)
    if (direct) return direct
  }

  const base = getDownloadBase(env)
  if (!base) throw new Error(`Env "${env}" non configuré — URL de base manquante.`)

  if (platform === 'win32')  return ENDPOINTS.zipWin32(base)
  if (platform === 'linux')  return ENDPOINTS.zipLinux(base)
  if (platform === 'darwin') return ENDPOINTS.zipDarwin(base)
  throw new Error(`Plateforme non supportée : ${platform}`)
}

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

function assertIsZipFile(filePath: string, sourceUrl: string): void {
  let fd: number
  try {
    fd = fs.openSync(filePath, 'r')
  } catch {
    throw new Error(`Impossible de lire le fichier téléchargé — ${sourceUrl}`)
  }
  try {
    const head = Buffer.alloc(4)
    const read = fs.readSync(fd, head, 0, 4, 0)
    if (read < 4 || !head.subarray(0, 4).equals(ZIP_MAGIC)) {
      throw new Error(
        `Le fichier reçu n’est pas une archive ZIP (souvent une page d’erreur HTML, ex. HTTP 404). Vérifiez l’URL : ${sourceUrl}`
      )
    }
  } finally {
    try {
      fs.closeSync(fd)
    } catch {
      /* ignore */
    }
  }
}

function sendProgress(win: BrowserWindow, progress: number, label: string): void {
  if (win.isDestroyed()) return
  win.webContents.send('files:progress', Math.min(100, Math.round(progress)), label)
}

// ─── Téléchargement ───────────────────────────────────────────────────────────

async function downloadZip(env: Env, destPath: string, win: BrowserWindow): Promise<string> {
  sendProgress(win, 0, 'Connexion au serveur...')

  const url = getZipUrl(env)

  let response: Awaited<ReturnType<typeof axios.get<NodeJS.ReadableStream>>>
  try {
    response = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: 'stream',
      timeout: 600_000,
      headers: {
        'User-Agent': 'DyingStar-Launcher/1.0',
        Accept:       'application/zip, application/octet-stream, */*'
      },
      validateStatus: (s) => s >= 200 && s < 300
    })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const code = err.response?.status
      const hint =
        code === 404
          ? ` — l’archive n’existe pas à cet emplacement (404). Définissez VITE_GAME_DOWNLOAD_BASE_* si les ZIP sont sur un autre hôte.`
          : ''
      throw new Error(`Téléchargement impossible${code ? ` (HTTP ${code})` : ''}${hint}\n${url}`)
    }
    throw err
  }

  if (response.status !== 200) {
    throw new Error(`Téléchargement refusé (HTTP ${response.status})\n${url}`)
  }

  const totalLength = Number(response.headers['content-length'] ?? 0)
  let downloaded = 0
  let lastProgressReport = 0

  const zipFilePath = path.join(destPath, '__game_download.zip')
  const writer = fs.createWriteStream(zipFilePath)

  await new Promise<void>((resolve, reject) => {
    const stream = response.data
    stream.on('error', reject)
    writer.on('error', reject)
    writer.on('finish', () => resolve())

    stream.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      if (!writer.write(chunk)) {
        stream.pause()
        writer.once('drain', () => stream.resume())
      }
      if (totalLength > 0) {
        sendProgress(
          win,
          (downloaded / totalLength) * 70,
          `Téléchargement... (${formatBytes(downloaded)} / ${formatBytes(totalLength)})`
        )
      } else if (downloaded - lastProgressReport >= 2 * 1024 * 1024) {
        lastProgressReport = downloaded
        sendProgress(win, Math.min(65, 15 + downloaded / (80 * 1024 * 1024) * 50),
          `Téléchargement... (${formatBytes(downloaded)})`)
      }
    })

    stream.on('end', () => writer.end())
  })

  assertIsZipFile(zipFilePath, url)

  return zipFilePath
}

// ─── Extraction ───────────────────────────────────────────────────────────────

async function extractZip(zipFilePath: string, destPath: string, win: BrowserWindow): Promise<void> {
  sendProgress(win, 70, 'Extraction des fichiers...')

  await extract(zipFilePath, {
    dir: destPath,
    onEntry: (_entry, zipFile) => {
      if (zipFile.entryCount > 0) {
        const pct = 70 + (zipFile.entriesRead / zipFile.entryCount) * 28
        sendProgress(win, pct, `Extraction... (${zipFile.entriesRead} / ${zipFile.entryCount} fichiers)`)
      }
    }
  })
}

// ─── Lecture version.json ─────────────────────────────────────────────────────

function readVersionManifest(gameRoot: string): InstallResult {
  const manifestPath = path.join(gameRoot, 'version.json')
  if (!fs.existsSync(manifestPath)) {
    console.warn('[Downloader] version.json introuvable.')
    return { version: 'unknown', releaseDate: new Date().toISOString().split('T')[0] }
  }
  try {
    const json = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      version?: string; releaseDate?: string
    }
    return {
      version:     json.version     ?? 'unknown',
      releaseDate: json.releaseDate ?? new Date().toISOString().split('T')[0]
    }
  } catch {
    return { version: 'unknown', releaseDate: new Date().toISOString().split('T')[0] }
  }
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

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
    sendProgress(win, 68, 'Préparation du dossier du jeu...')
    if (fs.existsSync(gameRoot)) {
      fs.rmSync(gameRoot, { recursive: true, force: true })
    }
    fs.mkdirSync(gameRoot, { recursive: true })

    await extractZip(zipFilePath, gameRoot, win)
    sendProgress(win, 99, 'Nettoyage...')
    fs.unlinkSync(zipFilePath)
    const manifest = readVersionManifest(gameRoot)
    sendProgress(win, 100, `Installation terminée — v${manifest.version}`)
    return manifest
  } catch (err) {
    if (zipFilePath && fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath)
    throw err
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)          return `${bytes} o`
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}