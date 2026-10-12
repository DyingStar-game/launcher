import * as fs from 'fs'
import * as path from 'path'
import {
  DOWNLOAD_PROGRESS,
  GAME_DOWNLOAD_META_NAME,
  GAME_DOWNLOAD_ZIP_NAME
} from '../../config/constants'
import type { Env } from '@shared/types/env'
import type { PendingDownload } from '@shared/types/install'

/** What identifies a partial download, written beside its ZIP (ADR 0036). */
export type DownloadMeta = {
  env: Env
  url: string
  etag: string | null
  lastModified: string | null
  /** Size of the whole archive, 0 when the server did not say. */
  total: number
}

/** Path of the ZIP being downloaded into an install folder. */
export function partialZipPath(installPath: string): string {
  return path.join(installPath, GAME_DOWNLOAD_ZIP_NAME)
}

function metaPath(installPath: string): string {
  return path.join(installPath, GAME_DOWNLOAD_META_NAME)
}

/** Size of a file in bytes, 0 when it does not exist. */
export function fileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size
  } catch {
    return 0
  }
}

/** Reads the partial download's metadata, null when missing or unreadable. */
export function readDownloadMeta(installPath: string): DownloadMeta | null {
  try {
    const raw = JSON.parse(fs.readFileSync(metaPath(installPath), 'utf8')) as Partial<DownloadMeta>
    if (typeof raw.env !== 'string' || typeof raw.url !== 'string') return null
    return {
      env: raw.env,
      url: raw.url,
      etag: typeof raw.etag === 'string' ? raw.etag : null,
      lastModified: typeof raw.lastModified === 'string' ? raw.lastModified : null,
      total: typeof raw.total === 'number' && raw.total > 0 ? raw.total : 0
    }
  } catch {
    return null
  }
}

/** Records what identifies the download starting in an install folder. */
export function writeDownloadMeta(installPath: string, meta: DownloadMeta): void {
  fs.writeFileSync(metaPath(installPath), JSON.stringify(meta))
}

/** Removes a partial download (its ZIP and metadata) from an install folder. */
export function deletePartialDownload(installPath: string): void {
  for (const file of [partialZipPath(installPath), metaPath(installPath)]) {
    fs.rmSync(file, { force: true })
  }
}

/** Overall install progress (0–100) once `downloaded` of `total` bytes are on disk. */
export function downloadProgress(downloaded: number, total: number): number {
  return total > 0 ? Math.min(1, downloaded / total) * DOWNLOAD_PROGRESS.zipWeight : 0
}

/** The environment's download left in an install folder, to resume, or null. */
export function findPendingDownload(env: Env, installPath: string): PendingDownload | null {
  const meta = readDownloadMeta(installPath)
  if (!meta || meta.env !== env) return null
  const downloaded = fileSize(partialZipPath(installPath))
  if (downloaded <= 0) return null
  return {
    downloaded,
    total: meta.total,
    progress: Math.round(downloadProgress(downloaded, meta.total))
  }
}
