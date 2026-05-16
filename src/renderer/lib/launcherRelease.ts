/**
 * Builds the GitHub release page URL for a launcher version tag.
 * @example https://github.com/DyingStar-game/launcher/releases/tag/v0.2.0
 */
export function launcherReleaseTagUrl(repoPageUrl: string, version: string): string {
  const base = repoPageUrl.trim().replace(/\/+$/, '')
  const trimmedVersion = version.trim()
  if (!base || !trimmedVersion) return ''
  const tag =
    trimmedVersion.startsWith('v') || trimmedVersion.startsWith('V')
      ? trimmedVersion
      : `v${trimmedVersion}`
  return `${base}/releases/tag/${tag}`
}
