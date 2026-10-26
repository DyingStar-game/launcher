import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { describe, expect, it } from 'vitest'
import { canUpdateInPlace, packageDownloadUrl, readPackageType } from './support'

const packaged = { packaged: true, appImage: undefined, packageType: null }

describe('canUpdateInPlace', () => {
  it('updates the Windows install', () => {
    expect(canUpdateInPlace({ ...packaged, platform: 'win32' })).toBe(true)
  })

  it('updates the AppImage it runs from', () => {
    const appImage = '/home/player/Dying_Star_Launcher.AppImage'
    expect(canUpdateInPlace({ ...packaged, platform: 'linux', appImage })).toBe(true)
  })

  it('keeps the link for deb and rpm, which would ask for a root password', () => {
    const appImage = '/somewhere.AppImage'
    expect(canUpdateInPlace({ ...packaged, platform: 'linux', appImage, packageType: 'deb' })).toBe(
      false
    )
    expect(canUpdateInPlace({ ...packaged, platform: 'linux', packageType: 'rpm' })).toBe(false)
  })

  it('keeps the link out of an AppImage, on macOS and unpackaged', () => {
    expect(canUpdateInPlace({ ...packaged, platform: 'linux' })).toBe(false)
    expect(canUpdateInPlace({ ...packaged, platform: 'darwin' })).toBe(false)
    expect(canUpdateInPlace({ ...packaged, packaged: false, platform: 'win32' })).toBe(false)
  })
})

describe('readPackageType', () => {
  it('reads electron-builder marker, null without one', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resources-'))
    expect(readPackageType(dir)).toBeNull()
    fs.writeFileSync(path.join(dir, 'package-type'), 'deb\n')
    expect(readPackageType(dir)).toBe('deb')
    fs.rmSync(dir, { recursive: true })
  })
})

describe('packageDownloadUrl', () => {
  const assets = [
    { name: 'Dying_Star_Launcher-Setup-1.4.0.exe', browser_download_url: 'https://dl/exe' },
    { name: 'Dying_Star_Launcher-1.4.0.AppImage', browser_download_url: 'https://dl/appimage' },
    { name: 'dying-star-launcher_1.4.0_amd64.deb', browser_download_url: 'https://dl/deb' },
    { name: 'dying-star-launcher-1.4.0.x86_64.rpm', browser_download_url: 'https://dl/rpm' }
  ]

  it('finds the package of the installed type', () => {
    expect(packageDownloadUrl(assets, 'deb')).toBe('https://dl/deb')
    expect(packageDownloadUrl(assets, 'rpm')).toBe('https://dl/rpm')
  })

  it('finds nothing for another install, or a release without the package', () => {
    expect(packageDownloadUrl(assets, null)).toBeNull()
    expect(packageDownloadUrl(assets, 'pacman')).toBeNull()
    expect(packageDownloadUrl(assets.slice(0, 2), 'deb')).toBeNull()
  })
})
