/** True si une version distante du jeu est strictement plus récente que la locale. */
export function isGameUpdateAvailable(
  installed: boolean,
  localVersion: string | null,
  latestRemoteVersion: string | null
): boolean {
  return (
    installed &&
    latestRemoteVersion !== null &&
    localVersion !== null &&
    latestRemoteVersion.localeCompare(localVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0
  )
}
