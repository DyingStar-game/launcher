import { BrowserWindow } from 'electron'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import extract from 'extract-zip'
import type { Env } from '../../renderer/store/env'

// ─── Configuration ────────────────────────────────────────────────────────────

const GAME_ZIP_URLS: Record<Env, Partial<Record<NodeJS.Platform, string>>> = {
  'universe': {
    win32:  'https://your-server.com/universe/latest-windows.zip',
    linux:  'https://your-server.com/universe/latest-linux.zip',
    darwin: 'https://your-server.com/universe/latest-macos.zip'
  },
  'universe-testing': {
    win32:  'https://your-server.com/universe-testing/latest-windows.zip',
    linux:  'https://your-server.com/universe-testing/latest-linux.zip',
    darwin: 'https://your-server.com/universe-testing/latest-macos.zip'
  }
}

function getZipUrl(env: Env): string {
  const url = GAME_ZIP_URLS[env][process.platform]
  if (!url) throw new Error(`Plateforme non supportée : ${process.platform}`)
  return url
}

// ─── Helper : envoyer la progression au renderer ──────────────────────────────

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

  const totalLength = parseInt(response.headers['content-length'] ?? '0', 10)
  let downloaded = 0

  const zipFilePath = path.join(destPath, '__game_download.zip')
  const writer = fs.createWriteStream(zipFilePath)

  await new Promise<void>((resolve, reject) => {
    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length
      writer.write(chunk)
      if (totalLength > 0) {
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

async function extractZip(zipFilePath: string, destPath: string, win: BrowserWindow): Promise<void> {
  sendProgress(win, 70, 'Extraction des fichiers...')

  await extract(zipFilePath, {
    dir: destPath,
    onEntry: (_entry, zipFile) => {
      const done = zipFile.entriesRead
      const total = zipFile.entryCount
      if (total > 0) {
        const pct = 70 + (done / total) * 28
        sendProgress(win, pct, `Extraction... (${done} / ${total} fichiers)`)
      }
    }
  })
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

export async function downloadAndInstall(
  env: Env,
  installPath: string,
  win: BrowserWindow
): Promise<void> {
  if (!fs.existsSync(installPath)) {
    fs.mkdirSync(installPath, { recursive: true })
  }

  let zipFilePath: string | null = null

  try {
    zipFilePath = await downloadZip(env, installPath, win)
    await extractZip(zipFilePath, installPath, win)

    sendProgress(win, 99, 'Nettoyage...')
    fs.unlinkSync(zipFilePath)
    sendProgress(win, 100, 'Installation terminée !')
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