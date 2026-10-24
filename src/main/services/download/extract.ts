import * as fs from 'fs'
import * as path from 'path'
import { pipeline } from 'stream/promises'
import StreamZip from 'node-stream-zip'
import type { BrowserWindow } from 'electron'
import { sendProgress } from './progress'

/** Absolute path of an entry, refusing one that resolves outside `destPath`. */
function entryTarget(destPath: string, name: string): string {
  const target = path.resolve(destPath, name)
  const relative = path.relative(destPath, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Malicious entry: ${name}`)
  }
  return target
}

/**
 * Extracts the ZIP into `destPath` and reports extraction progress (ADR 0049). An entry leaving
 * `destPath` fails before anything is written; links are written as plain files. Files are
 * written through `pipeline`, so a write error (`ENOSPC`, ADR 0047) rejects: `zip.extract()`
 * leaves it unhandled.
 */
export async function extractZip(
  zipFilePath: string,
  destPath: string,
  win: BrowserWindow
): Promise<void> {
  sendProgress(win, 70, { key: 'extracting', current: 0, total: 0 })

  const root = path.resolve(destPath)
  const zip = new StreamZip.async({ file: zipFilePath })
  try {
    const entries = Object.values(await zip.entries()).map((entry) => ({
      entry,
      target: entryTarget(root, entry.name)
    }))
    const files = entries.filter(({ entry }) => entry.isFile)
    for (const { entry, target } of entries) {
      if (entry.isDirectory) fs.mkdirSync(target, { recursive: true })
    }
    for (const [index, { entry, target }] of files.entries()) {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      await pipeline(await zip.stream(entry), fs.createWriteStream(target))
      sendProgress(win, 70 + ((index + 1) / files.length) * 28, {
        key: 'extracting',
        current: index + 1,
        total: files.length
      })
    }
  } finally {
    await zip.close()
  }
}
