import { compareGameVersions } from '@shared/gameVersion'

/**
 * Returns true when a remote game version is strictly newer than the locally installed one.
 */
export function isGameUpdateAvailable(
  installed: boolean,
  localVersion: string | null,
  latestRemoteVersion: string | null
): boolean {
  if (!installed || latestRemoteVersion === null || localVersion === null) {
    return false
  }
  return compareGameVersions(latestRemoteVersion, localVersion) > 0
}
