import type { BrowserWindow } from 'electron'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = await vi.hoisted(async () => {
  const { EventEmitter } = await import('events')
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  const appEvents = new EventEmitter()
  const updater = Object.assign(new EventEmitter(), {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    logger: null as unknown,
    checkForUpdates: vi.fn(() => Promise.resolve(null)),
    quitAndInstall: vi.fn()
  })
  return { handlers, appEvents, updater, gameRunning: false, installRunning: false }
})

vi.mock('electron', () => ({
  app: {
    isPackaged: true,
    on: (event: string, listener: () => void) => mocks.appEvents.on(event, listener)
  },
  ipcMain: {
    removeHandler: vi.fn(),
    handle: (channel: string, handler: (...args: unknown[]) => unknown) =>
      mocks.handlers.set(channel, handler)
  }
}))
vi.mock('electron-updater', () => ({ autoUpdater: mocks.updater }))
vi.mock('electron-log', () => ({ default: { warn: vi.fn() } }))
vi.mock('./support', () => ({ canUpdateInPlace: () => true, readPackageType: () => null }))
vi.mock('../download', () => ({ isAnyInstallRunning: () => mocks.installRunning }))
vi.mock('../game/processWatch', () => ({ isGameRunning: () => mocks.gameRunning }))

import { registerLauncherUpdateHandlers } from './updater'

const send = vi.fn()
const win = { isDestroyed: () => false, webContents: { send } } as unknown as BrowserWindow

/** Calls an IPC handler as the renderer would. */
function invoke(channel: string): unknown {
  return mocks.handlers.get(channel)!({})
}

beforeAll(() => registerLauncherUpdateHandlers(win))

beforeEach(() => {
  mocks.gameRunning = false
  mocks.installRunning = false
  vi.clearAllMocks()
})

describe('launcher update', () => {
  it('checks once and downloads by itself', () => {
    registerLauncherUpdateHandlers(win)
    expect(mocks.updater.autoDownload).toBe(true)
    expect(mocks.updater.listenerCount('update-downloaded')).toBe(1)
  })

  it('pushes the download, then the ready update', () => {
    mocks.updater.emit('update-available', { version: '1.4.0' })
    mocks.updater.emit('download-progress', { percent: 41.7 })
    expect(send).toHaveBeenLastCalledWith('launcher:update-state', {
      status: 'downloading',
      version: '1.4.0',
      percent: 41
    })
    mocks.updater.emit('update-downloaded', { version: '1.4.0' })
    expect(invoke('launcher:get-update-state')).toEqual({ status: 'ready', version: '1.4.0' })
  })

  it('refuses to install while the game runs or installs', () => {
    mocks.updater.emit('update-downloaded', { version: '1.4.0' })
    mocks.gameRunning = true
    expect(invoke('launcher:install-update')).toBe(false)
    mocks.gameRunning = false
    mocks.installRunning = true
    expect(invoke('launcher:install-update')).toBe(false)
    expect(mocks.updater.quitAndInstall).not.toHaveBeenCalled()
  })

  it('installs silently and starts the new launcher on click', () => {
    mocks.updater.emit('update-downloaded', { version: '1.4.0' })
    expect(invoke('launcher:install-update')).toBe(true)
    expect(mocks.updater.quitAndInstall).toHaveBeenCalledWith(true, true)
  })

  it('installs on quit, unless the game runs', () => {
    mocks.appEvents.emit('before-quit')
    expect(mocks.updater.autoInstallOnAppQuit).toBe(true)
    mocks.gameRunning = true
    mocks.appEvents.emit('before-quit')
    expect(mocks.updater.autoInstallOnAppQuit).toBe(false)
  })

  it('pushes an error, the renderer keeps the link', () => {
    mocks.updater.emit('error', new Error('latest.yml not found'))
    expect(send).toHaveBeenLastCalledWith('launcher:update-state', { status: 'error' })
  })
})
