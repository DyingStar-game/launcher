import { app } from 'electron'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { APP_PROTOCOL } from '../config/constants'

/** Registers a `.desktop` file so Linux can route custom protocol URLs to this app. */
export function registerLinuxProtocolHandler(): void {
  if (process.platform !== 'linux') return

  const desktopDir = path.join(app.getPath('home'), '.local', 'share', 'applications')
  const desktopFile = path.join(desktopDir, 'dyingstar-launcher.desktop')

  const execLine =
    process.defaultApp && process.argv.length >= 2
      ? `${process.execPath} ${path.resolve(process.argv[1])} %U`
      : `${process.execPath} %U`

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
      execSync(`update-desktop-database ${desktopDir}`)
    } catch {
      console.warn('[Protocol] update-desktop-database not available, skipping db update')
    }

    console.log(`[Protocol] ${APP_PROTOCOL}:// registered via xdg`)
  } catch (err) {
    console.error('[Protocol] Failed to register custom protocol handler:', err)
  }
}
