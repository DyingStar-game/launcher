import { BrowserWindow } from 'electron'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import extract from 'extract-zip'
import type { Env } from '../../renderer/store/env'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstallResult {
  version: string
  releaseDate: string
}

// ─── Configuration ────────────────────────────────────────────────────────────

const GAME_ZIP_URLS: Record<Env, Partial<Record<NodeJS.Platform, string>>> = {
  'universe': {
    win32:  'https://your-server.com/universe/latest-windows.zip',
    linux:  'https://your-server.com/universe/latest-linux.zip',
    darwin: 'https://your-server.com/universe/latest-macos.zip'
  },
  'universe-testing': {
    win32:  'https://dyingstar-game.com/DyingStar-windows-testing.zip',
    linux:  'https://dyingstar-game.com/DyingStar-linux-testing.zip',
    darwin: 'https://your-server.com/universe-testing/latest-macos.zip'
  }
}

function getZipUrl(env: Env): string {
  const url = GAME_ZIP_URLS[env][process.platform]
  if (!url) throw new Error(`Plateforme non supportée : ${process.platform}`)
  return url
}

// ─── Helper progression ───────────────────────────────────────────────────────

function sendProgress(win: BrowserWindow, progress: number, label: string): void {
  if (win.isDestroyed()) return
  win.webContents.send('files:progress', Math.min(100, Math.round(progress)), label)
}

// ─── Téléchargement ───────────────────────────────────────────────────────────

async function downloadZip(env: Env, destPath: string, win: BrowserWindow): Promise<string> {
  sendProgress(win, 0, 'Connexion au serveur...')

  const response = await axios.get<NodeJS.ReadableStream>(getZipUrl(env), {
    responseType: 'stream',
    timeout: 30_000,
    headers: { 'User-Agent': 'DyingStar-Launcher/1.0' }
  })

  const totalLength = parseInt(String(response.headers['content-length'] ?? '0'), 10)
  let downloaded = 0

  const zipFilePath = path.join(destPath, '__game_download.zip')
  const writer = fs.createWriteStream(zipFilePath)

  await new Promise<void>((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      writer.write(chunk)
      if (totalLength > 0) {
        sendProgress(win, (downloaded / totalLength) * 70,
          `Téléchargement... (${formatBytes(downloaded)} / ${formatBytes(totalLength)})`)
      }
    })
    response.data.on('end', () => { writer.end(); resolve() })
    response.data.on('error', reject)
    writer.on('error', reject)
  })

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

// ─── Lecture du manifeste de version ─────────────────────────────────────────

function readVersionManifest(installPath: string): InstallResult {
  // Le ZIP doit contenir un fichier version.json à sa racine :
  // { "version": "1.2.0", "releaseDate": "2026-05-01" }
  const manifestPath = path.join(installPath, 'version.json')

  if (!fs.existsSync(manifestPath)) {
    console.warn('[Downloader] version.json introuvable, valeurs par défaut utilisées.')
    return {
      version: 'unknown',
      releaseDate: new Date().toISOString().split('T')[0]
    }
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const json = JSON.parse(raw) as { version?: string; releaseDate?: string }
    return {
      version:     json.version     ?? 'unknown',
      releaseDate: json.releaseDate ?? new Date().toISOString().split('T')[0]
    }
  } catch {
    console.warn('[Downloader] Impossible de parser version.json.')
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
    await extractZip(zipFilePath, installPath, win)

    sendProgress(win, 99, 'Nettoyage...')
    fs.unlinkSync(zipFilePath)

    // Lire version.json extrait du zip
    const manifest = readVersionManifest(installPath)
    sendProgress(win, 100, `Installation terminée — v${manifest.version}`)
    return manifest
  } catch (err) {
    if (zipFilePath && fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath)
    throw err
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}