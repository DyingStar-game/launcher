import type { BrowserWindow } from 'electron'
import type { ChildProcess } from 'child_process'
import { GAME_PROCESS_POLL_MS } from '../../config/constants'

let launcherWindow: BrowserWindow | null = null
let trackedGamePid: number | null = null
let gamePollTimer: ReturnType<typeof setInterval> | null = null

/** Binds the window that receives `game:running-changed` events. */
export function setLauncherWindow(win: BrowserWindow): void {
  launcherWindow = win
}

/** Returns true when a game process launched by the launcher is still alive. */
export function isGameRunning(): boolean {
  return trackedGamePid !== null && isPidAlive(trackedGamePid)
}

/** Sends running state to the renderer. */
function notifyGameRunning(running: boolean): void {
  if (!launcherWindow || launcherWindow.isDestroyed()) return
  launcherWindow.webContents.send('game:running-changed', { running })
}

/** Returns true if sending signal 0 to the pid does not throw (process exists). */
function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Stops polling and clears the tracked game PID. */
function clearGameWatch(): void {
  if (gamePollTimer) {
    clearInterval(gamePollTimer)
    gamePollTimer = null
  }
  trackedGamePid = null
}

/** Poll callback: clears watch and notifies renderer when the game process exited. */
function stopGameWatchIfExited(): void {
  if (trackedGamePid === null) return
  if (!isPidAlive(trackedGamePid)) {
    clearGameWatch()
    notifyGameRunning(false)
  }
}

/** Tracks a detached game child process until it exits. */
export function watchGameProcess(child: ChildProcess): void {
  clearGameWatch()
  const pid = child.pid
  if (!pid) return

  trackedGamePid = pid
  notifyGameRunning(true)

  const onDone = (): void => {
    if (trackedGamePid !== pid) return
    clearGameWatch()
    notifyGameRunning(false)
  }

  child.once('exit', onDone)
  child.once('error', onDone)
  gamePollTimer = setInterval(stopGameWatchIfExited, GAME_PROCESS_POLL_MS)
}
