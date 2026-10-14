import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import yauzl from 'yauzl'
import { GAME_FILES_LIST_NAME } from '../../config/constants'

/** The files the launcher installed, per game folder (absolute path). */
type GameFileLists = Record<string, string[]>

function listsPath(): string {
  return path.join(app.getPath('userData'), GAME_FILES_LIST_NAME)
}

function readLists(): GameFileLists {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(listsPath(), 'utf8'))
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as GameFileLists) : {}
  } catch {
    return {}
  }
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

/** The files the launcher installed in a game folder, null when it never recorded them. */
export function readGameFiles(gameRoot: string): string[] | null {
  const files = readLists()[path.resolve(gameRoot)]
  if (!Array.isArray(files)) return null
  return files.filter((file): file is string => typeof file === 'string')
}

/** Records the files the launcher installed in a game folder (ADR 0038). */
export function writeGameFiles(gameRoot: string, files: string[]): void {
  const lists = readLists()
  lists[path.resolve(gameRoot)] = [...new Set(files)].sort()
  fs.mkdirSync(path.dirname(listsPath()), { recursive: true })
  fs.writeFileSync(listsPath(), JSON.stringify(lists))
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
