import { EventEmitter } from 'events'
import type { ChildProcess } from 'child_process'
import type { BrowserWindow } from 'electron'
import log from 'electron-log'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLauncherWindow, watchGameProcess } from './processWatch'

vi.mock('electron-log', () => ({ default: { info: vi.fn(), error: vi.fn() } }))

/** A launcher window, minimized or not. */
function launcher(minimized: boolean): BrowserWindow {
  return {
    isDestroyed: () => false,
    isMinimized: () => minimized,
    restore: vi.fn(),
    webContents: { send: vi.fn() }
  } as unknown as BrowserWindow
}

/** A game process that exits when told to. */
function game(): ChildProcess & EventEmitter {
  return Object.assign(new EventEmitter(), { pid: 4242 }) as unknown as ChildProcess & EventEmitter
}

afterEach(() => vi.useRealTimers())

describe('watchGameProcess', () => {
  it('brings back the launcher minimized at launch when the game exits', () => {
    vi.useFakeTimers()
    const win = launcher(true)
    setLauncherWindow(win)
    const child = game()
    watchGameProcess(child)
    expect(win.webContents.send).toHaveBeenCalledWith('game:running-changed', { running: true })
    expect(win.restore).not.toHaveBeenCalled()

    child.emit('exit', 0)
    expect(win.webContents.send).toHaveBeenCalledWith('game:running-changed', { running: false })
    expect(win.restore).toHaveBeenCalledOnce()
  })

  it('leaves a launcher the player brought back as it is', () => {
    vi.useFakeTimers()
    const win = launcher(false)
    setLauncherWindow(win)
    const child = game()
    watchGameProcess(child)

    child.emit('exit', 0)
    expect(win.restore).not.toHaveBeenCalled()
  })

  it('writes how the game ended in the launcher log', () => {
    vi.useFakeTimers()
    setLauncherWindow(launcher(false))
    const child = game()
    watchGameProcess(child)

    child.emit('exit', null, 'SIGABRT')
    expect(log.info).toHaveBeenCalledWith('[Game] Exited with code null (signal SIGABRT)')
  })
})
