import { app } from 'electron'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { APP_PROTOCOL } from '../config/constants'

/** What the `Exec` line of the protocol handler depends on. */
export interface ExecContext {
  execPath: string
  /** Script path when run through the bare Electron binary (`make dev`). */
  devScript?: string
  /** Path of the `.AppImage` file, set by the AppImage runtime. */
  appImage?: string
  /** `appimage-run` when on NixOS, where an AppImage only runs through it. */
  appImageRunner?: string
}

/** Quotes one argument of a desktop entry `Exec` line (Desktop Entry spec). */
export function quoteExecArg(arg: string): string {
  if (!/[\s"'\\`$<>~|&;*?#()]/.test(arg)) return arg
  return `"${arg.replace(/(["`$\\])/g, '\\$1')}"`
}

/**
 * Builds the `Exec` line opening `dyingstar://` URLs. An AppImage runs from a mount that
 * changes at each launch and needs its runtime, so the `.AppImage` file itself is used.
 */
export function buildExecLine({
  execPath,
  devScript,
  appImage,
  appImageRunner
}: ExecContext): string {
  const command = appImage
    ? [...(appImageRunner ? [appImageRunner] : []), appImage]
    : [execPath, ...(devScript ? [devScript] : [])]
  return [...command.map(quoteExecArg), '%U'].join(' ')
}

/** Finds `appimage-run` on NixOS, which cannot run an AppImage binary directly. */
function findNixAppImageRunner(): string | undefined {
  if (!fs.existsSync('/etc/NIXOS')) return undefined
  try {
    return execSync('command -v appimage-run', { encoding: 'utf-8' }).trim() || undefined
  } catch {
    return undefined
  }
}

/** Registers a `.desktop` file so Linux can route custom protocol URLs to this app. */
export function registerLinuxProtocolHandler(): void {
  if (process.platform !== 'linux') return

  const desktopDir = path.join(app.getPath('home'), '.local', 'share', 'applications')
  const desktopFile = path.join(desktopDir, 'dyingstar-launcher.desktop')

  const appImage = process.env.APPIMAGE
  const execLine = buildExecLine({
    execPath: process.execPath,
    devScript:
      process.defaultApp && process.argv.length >= 2 ? path.resolve(process.argv[1]) : undefined,
    appImage,
    appImageRunner: appImage ? findNixAppImageRunner() : undefined
  })

  const contents =
    [
      '[Desktop Entry]',
      'Type=Application',
      'Name=DyingStar Launcher',
      `Exec=${execLine}`,
      `MimeType=x-scheme-handler/${APP_PROTOCOL};`,
      'NoDisplay=true'
    ].join('\n') + '\n'

  try {
    fs.mkdirSync(desktopDir, { recursive: true })
    fs.writeFileSync(desktopFile, contents, 'utf-8')

    try {
      execSync(`xdg-mime default dyingstar-launcher.desktop x-scheme-handler/${APP_PROTOCOL}`)
    } catch {
      console.warn('[Protocol] xdg-mime not available, skipping mime association')
    }

    try {
      execSync(`update-desktop-database ${quoteExecArg(desktopDir)}`)
    } catch {
      console.warn('[Protocol] update-desktop-database not available, skipping db update')
    }

    console.log(`[Protocol] ${APP_PROTOCOL}:// registered via xdg (Exec=${execLine})`)
  } catch (err) {
    console.error('[Protocol] Failed to register custom protocol handler:', err)
  }
}
