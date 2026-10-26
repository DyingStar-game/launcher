import { describe, expect, it } from 'vitest'
import { gameSpawnEnv } from './spawnEnv'

const appDir = '/tmp/.mount_Dying_abc123'

describe('gameSpawnEnv', () => {
  it('removes the AppImage directories and keeps the player own entries', () => {
    const env = gameSpawnEnv({
      APPDIR: appDir,
      APPIMAGE: '/home/player/Dying_Star_Launcher.AppImage',
      ARGV0: 'Dying_Star_Launcher.AppImage',
      OWD: '/home/player',
      PATH: `${appDir}:${appDir}/usr/sbin:/usr/local/bin:/usr/bin`,
      LD_LIBRARY_PATH: `${appDir}/usr/lib:/opt/cuda/lib64`,
      XDG_DATA_DIRS: `${appDir}/usr/share/:/usr/share:/usr/share/gnome:/usr/local/share/:/usr/share/`,
      GSETTINGS_SCHEMA_DIR: `${appDir}/usr/share/glib-2.0/schemas`,
      HOME: '/home/player'
    })

    expect(env).toEqual({
      PATH: '/usr/local/bin:/usr/bin',
      LD_LIBRARY_PATH: '/opt/cuda/lib64',
      XDG_DATA_DIRS: '/usr/share:/usr/share/gnome:/usr/local/share/:/usr/share/',
      HOME: '/home/player'
    })
  })

  it('drops a path list left with only AppImage entries', () => {
    const env = gameSpawnEnv({ APPDIR: appDir, LD_LIBRARY_PATH: `${appDir}/usr/lib` })

    expect(env).not.toHaveProperty('LD_LIBRARY_PATH')
  })

  it('restores the desktop Electron replaced', () => {
    const env = gameSpawnEnv({
      XDG_CURRENT_DESKTOP: 'Unity',
      ORIGINAL_XDG_CURRENT_DESKTOP: 'GNOME'
    })

    expect(env).toEqual({ XDG_CURRENT_DESKTOP: 'GNOME' })
  })

  it('leaves the environment as is outside an AppImage', () => {
    const source = { PATH: '/usr/bin', LD_LIBRARY_PATH: '/opt/lib' }

    expect(gameSpawnEnv(source)).toEqual(source)
  })
})
