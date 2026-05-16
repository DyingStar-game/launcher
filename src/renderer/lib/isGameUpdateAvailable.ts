/**
 * Returns true when a remote game version is strictly newer than the locally installed one.
 */
export function isGameUpdateAvailable(
  installed: boolean,
  localVersion: string | null,
  latestRemoteVersion: string | null
): boolean {
  return (
    installed &&
    latestRemoteVersion !== null &&
    localVersion !== null &&
    latestRemoteVersion.localeCompare(localVersion, undefined, {
      numeric: true,
      sensitivity: 'base'
    }) > 0
  )
}
