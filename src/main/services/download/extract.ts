import extract from 'extract-zip'
import type { BrowserWindow } from 'electron'
import { sendProgress } from './progress'

/** Extracts the ZIP into `destPath` and reports extraction progress. */
export async function extractZip(
  zipFilePath: string,
  destPath: string,
  win: BrowserWindow
): Promise<void> {
  sendProgress(win, 70, { key: 'extracting', current: 0, total: 0 })

  await extract(zipFilePath, {
    dir: destPath,
    onEntry: (_entry, zipFile) => {
      if (zipFile.entryCount > 0) {
        const pct = 70 + (zipFile.entriesRead / zipFile.entryCount) * 28
        sendProgress(win, pct, {
          key: 'extracting',
          current: zipFile.entriesRead,
          total: zipFile.entryCount
        })
      }
    }
  })
}
