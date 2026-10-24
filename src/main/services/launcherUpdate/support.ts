import * as fs from 'fs'
import * as path from 'path'

/** What decides whether this launcher run can replace itself. */
export type UpdateSupportInput = {
  packaged: boolean
  platform: NodeJS.Platform
  /** The `APPIMAGE` variable: the AppImage file the launcher runs from. */
  appImage: string | undefined
  /** electron-builder's `resources/package-type` (deb, rpm…), null without it. */
  packageType: string | null
}

/**
 * True when electron-updater replaces this launcher in place (ADR 0050): the NSIS install on
 * Windows, the AppImage on Linux. deb and rpm (a root password prompt), macOS (unsigned) and
 * unpackaged runs keep the download link.
 */
export function canUpdateInPlace({
  packaged,
  platform,
  appImage,
  packageType
}: UpdateSupportInput): boolean {
  if (!packaged) return false
  if (platform === 'win32') return true
  if (platform === 'linux') return !packageType && Boolean(appImage)
  return false
}

/** A file attached to a GitHub release. */
export type ReleaseAsset = { name: string; browser_download_url: string }

/**
 * The release's package of the type this launcher was installed from (`deb`, `rpm`), for a
 * direct download where it cannot update itself (ADR 0050); null for another type or none.
 */
export function packageDownloadUrl(
  assets: ReleaseAsset[],
  packageType: string | null
): string | null {
  if (packageType !== 'deb' && packageType !== 'rpm') return null
  return assets.find((a) => a.name.endsWith(`.${packageType}`))?.browser_download_url ?? null
}

/** Reads electron-builder's package type marker, null when there is none (NSIS, AppImage). */
export function readPackageType(resourcesPath: string): string | null {
  try {
    return fs.readFileSync(path.join(resourcesPath, 'package-type'), 'utf8').trim() || null
  } catch {
    return null
  }
}
