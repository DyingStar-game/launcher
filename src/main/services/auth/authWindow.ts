import { app, BrowserWindow, shell } from 'electron'
import { loadAppIcon } from '../../icon'
import { APP_PROTOCOL } from '../../config/constants'
import { AUTH_WINDOW_BOUNDS } from '../../config/auth'

/** Chrome-like UA so Discord OAuth pages treat the window as a normal browser. */
const AUTH_WINDOW_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

let authWindow: BrowserWindow | null = null

function isAppAuthCallback(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === `${APP_PROTOCOL}:` &&
      parsed.host === 'auth' &&
      parsed.pathname === '/callback'
    )
  } catch {
    return false
  }
}

function isDiscordDeepLink(url: string): boolean {
  return url.startsWith('discord://') || url.startsWith('discordapp://')
}

export type AuthWindowHandlers = {
  onCallback: (callbackUrl: string) => void
  onAbort: () => void
  onLoadFailed: (message: string) => void
}

/** Opens an in-app browser window for the Keycloak / Discord OAuth flow. */
export function openAuthWindow(
  parent: BrowserWindow | null,
  authUrl: string,
  handlers: AuthWindowHandlers
): void {
  closeAuthWindow()

  const appIcon = loadAppIcon()
  const win = new BrowserWindow({
    width: AUTH_WINDOW_BOUNDS.width,
    height: AUTH_WINDOW_BOUNDS.height,
    minWidth: AUTH_WINDOW_BOUNDS.minWidth,
    minHeight: AUTH_WINDOW_BOUNDS.minHeight,
    parent: parent ?? undefined,
    modal: parent != null,
    show: false,
    autoHideMenuBar: true,
    title: app.getName(),
    backgroundColor: '#36393f',
    ...(appIcon ? { icon: appIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  authWindow = win
  let settled = false

  const settle = (action: () => void): void => {
    if (settled) return
    settled = true
    action()
  }

  const finishWithCallback = (callbackUrl: string): void => {
    settle(() => {
      handlers.onCallback(callbackUrl)
      closeAuthWindow()
    })
  }

  const abort = (): void => {
    settle(() => {
      handlers.onAbort()
    })
  }

  win.on('closed', () => {
    authWindow = null
    abort()
  })

  const interceptNavigation = (event: Electron.Event, url: string): void => {
    if (isAppAuthCallback(url)) {
      event.preventDefault()
      finishWithCallback(url)
      return
    }
    if (isDiscordDeepLink(url)) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  }

  win.webContents.setUserAgent(AUTH_WINDOW_USER_AGENT)
  win.webContents.on('will-navigate', interceptNavigation)
  win.webContents.on('will-redirect', interceptNavigation)

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppAuthCallback(url)) {
      finishWithCallback(url)
      return { action: 'deny' }
    }
    if (isDiscordDeepLink(url)) {
      void shell.openExternal(url)
      return { action: 'deny' }
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on(
    'did-fail-load',
    (_event, errorCode, _errorDescription, _validatedURL, isMainFrame) => {
      if (!isMainFrame || settled) return
      // Navigation aborted intentionally (e.g. custom protocol redirect).
      if (errorCode === -3) return
      settle(() => {
        handlers.onLoadFailed(`load_failed_${errorCode}`)
        closeAuthWindow()
      })
    }
  )

  win.once('ready-to-show', () => {
    if (!settled) win.show()
  })

  void win.loadURL(authUrl).catch((err: unknown) => {
    console.error('[Auth] Failed to load auth URL:', err)
    settle(() => {
      handlers.onLoadFailed('load_failed')
      closeAuthWindow()
    })
  })
}

/** Closes the OAuth window if it is still open. */
export function closeAuthWindow(): void {
  if (!authWindow || authWindow.isDestroyed()) {
    authWindow = null
    return
  }
  authWindow.removeAllListeners('closed')
  authWindow.close()
  authWindow = null
}
