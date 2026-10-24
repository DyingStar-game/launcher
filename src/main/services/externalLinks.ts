import { app, shell } from 'electron'

/** Invite hosts whose path is `/<code>` (`discord.gg`) or `/invite/<code>` (`discord.com`). */
const INVITE_PATTERNS: Record<string, RegExp> = {
  'discord.gg': /^\/([\w-]+)\/?$/,
  'discord.com': /^\/invite\/([\w-]+)\/?$/,
  'www.discord.com': /^\/invite\/([\w-]+)\/?$/
}

/** The Discord app URL of a Discord invite link (`discord://-/invite/<code>`), or null. */
export function discordAppInviteUrl(url: string): string | null {
  try {
    const { protocol, hostname, pathname } = new URL(url)
    if (protocol !== 'https:' && protocol !== 'http:') return null
    const code = INVITE_PATTERNS[hostname]?.exec(pathname)?.[1]
    return code ? `discord://-/invite/${code}` : null
  } catch {
    return null
  }
}

/**
 * Opens a link outside the launcher: a Discord invite in the Discord app when the OS has one, the
 * web page otherwise or when the app cannot be opened (ADR 0043); any other link in the browser.
 */
export async function openExternalLink(url: string): Promise<void> {
  const appUrl = discordAppInviteUrl(url)
  if (appUrl && app.getApplicationNameForProtocol(appUrl)) {
    try {
      await shell.openExternal(appUrl)
      return
    } catch (err) {
      console.warn('[Links] Discord app could not be opened, falling back to the web page', err)
    }
  }
  await shell.openExternal(url)
}
