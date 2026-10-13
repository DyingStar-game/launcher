import * as fs from 'fs'
import * as path from 'path'
import yauzl from 'yauzl'
import { GAME_FILES_LIST_NAME } from '../../config/constants'

function listPath(installPath: string): string {
  return path.join(installPath, GAME_FILES_LIST_NAME)
}

/** Paths of the files an archive holds, relative to its root (folders left out). */
export function listArchiveFiles(zipFilePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipFilePath, { lazyEntries: true }, (openErr, zipFile) => {
      if (openErr) return reject(openErr)
      const files: string[] = []
      zipFile.on('entry', (entry: yauzl.Entry) => {
        if (!entry.fileName.endsWith('/')) files.push(entry.fileName)
        zipFile.readEntry()
      })
      zipFile.on('end', () => resolve(files))
      zipFile.on('error', reject)
      zipFile.readEntry()
    })
  })
}

/** The files the launcher installed in an install folder's game, null when it never recorded them. */
export function readGameFiles(installPath: string): string[] | null {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(listPath(installPath), 'utf8'))
    if (!Array.isArray(raw)) return null
    return raw.filter((file): file is string => typeof file === 'string')
  } catch {
    return null
  }
}

/** Records the files the launcher installed in an install folder's game. */
export function writeGameFiles(installPath: string, files: string[]): void {
  fs.writeFileSync(listPath(installPath), JSON.stringify([...new Set(files)].sort()))
}

/** Absolute path of a listed file, null when it would resolve outside the game folder. */
function insideGameRoot(gameRoot: string, file: string): string | null {
  const target = path.resolve(gameRoot, file)
  const relative = path.relative(gameRoot, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null
  return target
}

/**
 * Removes the listed files from the game folder, then the folders they leave empty, deepest
 * first; anything else (screenshots, videos…) stays.
 */
export function removeGameFiles(gameRoot: string, files: string[]): void {
  const root = path.resolve(gameRoot)
  const folders = new Set<string>()
  for (const file of files) {
    const target = insideGameRoot(root, file)
    if (!target) continue
    try {
      if (!fs.lstatSync(target).isDirectory()) fs.rmSync(target, { force: true })
    } catch {
      // Already gone
    }
    for (let dir = path.dirname(target); dir !== root; dir = path.dirname(dir)) folders.add(dir)
  }
  const deepestFirst = [...folders].sort((a, b) => b.length - a.length)
  for (const dir of deepestFirst) {
    try {
      fs.rmdirSync(dir)
    } catch {
      // Not empty (it holds the player's files) or already gone
    }
  }
}
