import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getApplicationNameForProtocol: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

import { app, shell } from 'electron'
import { discordAppInviteUrl, openExternalLink } from './externalLinks'

afterEach(() => {
  vi.clearAllMocks()
})

describe('discordAppInviteUrl', () => {
  it.each([
    ['https://discord.gg/geWRctZfMn', 'discord://-/invite/geWRctZfMn'],
    ['https://discord.gg/geWRctZfMn/', 'discord://-/invite/geWRctZfMn'],
    ['https://discord.com/invite/geWRctZfMn', 'discord://-/invite/geWRctZfMn'],
    ['https://www.discord.com/invite/geWRctZfMn', 'discord://-/invite/geWRctZfMn']
  ])('turns the invite %s into %s', (url, expected) => {
    expect(discordAppInviteUrl(url)).toBe(expected)
  })

  it.each([
    'https://discord.com/channels/123',
    'https://dyingstar-game.com',
    'https://evil.test/discord.gg/abc',
    'not a url'
  ])('ignores %s', (url) => {
    expect(discordAppInviteUrl(url)).toBeNull()
  })
})

describe('openExternalLink', () => {
  const invite = 'https://discord.gg/geWRctZfMn'

  it('opens an invite in the Discord app when the OS has one', async () => {
    vi.mocked(app.getApplicationNameForProtocol).mockReturnValue('Discord')
    await openExternalLink(invite)
    expect(shell.openExternal).toHaveBeenCalledExactlyOnceWith('discord://-/invite/geWRctZfMn')
  })

  it('opens the invite web page without a Discord app', async () => {
    vi.mocked(app.getApplicationNameForProtocol).mockReturnValue('')
    await openExternalLink(invite)
    expect(shell.openExternal).toHaveBeenCalledExactlyOnceWith(invite)
  })

  it('falls back to the web page when the Discord app cannot be opened', async () => {
    vi.mocked(app.getApplicationNameForProtocol).mockReturnValue('Discord')
    vi.mocked(shell.openExternal).mockRejectedValueOnce(new Error('no handler'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await openExternalLink(invite)
    expect(shell.openExternal).toHaveBeenLastCalledWith(invite)
    warn.mockRestore()
  })

  it('opens any other link in the browser', async () => {
    await openExternalLink('https://dyingstar-game.com')
    expect(app.getApplicationNameForProtocol).not.toHaveBeenCalled()
    expect(shell.openExternal).toHaveBeenCalledExactlyOnceWith('https://dyingstar-game.com')
  })
})
