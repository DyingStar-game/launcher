// src/main/services/downloader.ts

import { BrowserWindow } from 'electron'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import extract from 'extract-zip'

// ─── Configuration ────────────────────────────────────────────────────────────

/** URLs par OS — à remplacer par les URLs réelles */
const GAME_ZIP_URLS: Partial<Record<NodeJS.Platform, string>> = {
  win32:  'https://your-server.com/game/latest-windows.zip',
  darwin: 'https://your-server.com/game/latest-macos.zip',
  linux:  'https://your-server.com/game/latest-linux.zip',
}

/**
 * Retourne l'URL de téléchargement adaptée à l'OS courant.
 * Lève une erreur si la plateforme n'est pas supportée.
 */
function getZipUrl(): string {
  const url = GAME_ZIP_URLS[process.platform]
  if (!url) throw new Error(`Plateforme non supportée : ${process.platform}`)
  return url
}

// ─── Helper : envoyer la progression au renderer ──────────────────────────────

function sendProgress(win: BrowserWindow, progress: number, label: string): void {
  if (win.isDestroyed()) return
  win.webContents.send('files:progress', Math.min(100, Math.round(progress)), label)
}

// ─── Téléchargement ───────────────────────────────────────────────────────────

async function downloadZip(
  destPath: string,
  win: BrowserWindow
): Promise<string> {
  sendProgress(win, 0, 'Connexion au serveur...')

  const response = await axios.get<NodeJS.ReadableStream>(getZipUrl(), {
    responseType: 'stream',
    timeout: 30_000,
    headers: { 'User-Agent': 'DyingStar-Launcher/1.0' }
  })

  const totalLength = parseInt(response.headers['content-length'] ?? '0', 10)
  let downloaded = 0

  const zipFilePath = path.join(destPath, '__game_download.zip')
  const writer = fs.createWriteStream(zipFilePath)

  await new Promise<void>((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      writer.write(chunk)

      if (totalLength > 0) {
        // Le téléchargement représente 70% de la progression totale
        const pct = (downloaded / totalLength) * 70
        sendProgress(win, pct, `Téléchargement... (${formatBytes(downloaded)} / ${formatBytes(totalLength)})`)
      }
    })

    response.data.on('end', () => { writer.end(); resolve() })
    response.data.on('error', reject)
    writer.on('error', reject)
  })

  return zipFilePath
}

// ─── Extraction ───────────────────────────────────────────────────────────────

async function extractZip(
  zipFilePath: string,
  destPath: string,
  win: BrowserWindow
): Promise<void> {
  sendProgress(win, 70, 'Extraction des fichiers...')

  await extract(zipFilePath, {
    dir: destPath,
    onEntry: (_entry, zipFile) => {
      const done = zipFile.entriesRead
      const total = zipFile.entryCount
      if (total > 0) {
        // L'extraction représente 28% de la progression totale (70 → 98)
        const pct = 70 + (done / total) * 28
        sendProgress(win, pct, `Extraction... (${done} / ${total} fichiers)`)
      }
    }
  })
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

/**
 * Télécharge le ZIP du jeu depuis le serveur, l'extrait dans `installPath`,
 * puis supprime l'archive temporaire.
 *
 * La progression (0–100) est envoyée en continu au renderer via
 * l'événement IPC `files:progress`.
 */
export async function downloadAndInstall(
  installPath: string,
  win: BrowserWindow
): Promise<void> {
  // 1. Créer le répertoire cible si besoin
  if (!fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true })
  }

  let zipFilePath: string | null = null

  try {
    // 2. Téléchargement
    zipFilePath = await downloadZip(installPath, win)

    // 3. Extraction
    await extractZip(zipFilePath, installPath, win)

    // 4. Nettoyage de l'archive temporaire
    sendProgress(win, 99, 'Nettoyage...')
    fs.unlinkSync(zipFilePath)

    sendProgress(win, 100, 'Installation terminée !')
  } catch (err) {
    // Nettoyage en cas d'erreur
    if (zipFilePath && fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath)
    }
    throw err
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}