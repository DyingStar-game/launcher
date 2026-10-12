import { describe, expect, it } from 'vitest'
import { canStopInstall, gameAction, type GameActionState } from './gameAction'

const ready: GameActionState = {
  available: true,
  installed: true,
  installing: false,
  paused: false,
  updateAvailable: false,
  serverStatus: 'online',
  accountStatus: 'connected',
  sessionExpired: false,
  launching: false,
  running: false
}

describe('gameAction', () => {
  it('offers Play when everything is ready', () => {
    expect(gameAction(ready)).toBe('play')
  })

  it.each([
    [{ available: false, installing: true }, 'unavailable'],
    [{ installing: true, installed: false }, 'installing'],
    [{ paused: true, installed: false }, 'paused'],
    [{ paused: true, updateAvailable: true, serverStatus: 'offline' }, 'paused'],
    [{ installed: false, serverStatus: 'offline' }, 'install'],
    [{ updateAvailable: true, accountStatus: 'disconnected' }, 'update'],
    [{ running: true, serverStatus: 'offline' }, 'running'],
    [{ launching: true }, 'launching'],
    [{ serverStatus: 'maintenance', accountStatus: 'disconnected' }, 'serverDown'],
    [{ serverStatus: 'degraded' }, 'serverDown'],
    [{ accountStatus: 'loading' }, 'checkingSession'],
    [{ accountStatus: 'disconnected' }, 'signIn'],
    [{ sessionExpired: true }, 'signIn']
  ] as const)('%o → %s', (patch, expected) => {
    expect(gameAction({ ...ready, ...patch })).toBe(expected)
  })
})

describe('canStopInstall', () => {
  it('allows pausing until extraction starts', () => {
    expect(canStopInstall({ key: 'downloading', downloaded: 1, total: 2 })).toBe(true)
    expect(canStopInstall({ key: 'connecting' })).toBe(true)
    expect(canStopInstall({ key: 'preparing' })).toBe(false)
    expect(canStopInstall({ key: 'extracting', current: 1, total: 2 })).toBe(false)
  })
})
