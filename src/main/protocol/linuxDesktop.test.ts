import { describe, expect, it, vi } from 'vitest'
import { buildExecLine, quoteExecArg } from './linuxDesktop'

vi.mock('electron', () => ({ app: {} }))

describe('quoteExecArg', () => {
  it('leaves a plain path as is', () => {
    expect(quoteExecArg('/opt/launcher/dying-star')).toBe('/opt/launcher/dying-star')
  })

  it('quotes a path with spaces and escapes reserved characters', () => {
    expect(quoteExecArg('/home/a b/$x"y.AppImage')).toBe('"/home/a b/\\$x\\"y.AppImage"')
  })
})

describe('buildExecLine', () => {
  it('uses the binary for an unpacked install', () => {
    expect(buildExecLine({ execPath: '/opt/ds/launcher' })).toBe('/opt/ds/launcher %U')
  })

  it('passes the script in development', () => {
    expect(buildExecLine({ execPath: '/e/electron', devScript: '/repo/out/main' })).toBe(
      '/e/electron /repo/out/main %U'
    )
  })

  it('uses the AppImage file, not its temporary mount', () => {
    expect(
      buildExecLine({
        execPath: '/tmp/.mount_DyingAbc/dying-star-launcher',
        appImage: '/home/p/Games/Dying Star.AppImage'
      })
    ).toBe('"/home/p/Games/Dying Star.AppImage" %U')
  })

  it('runs the AppImage through appimage-run on NixOS', () => {
    expect(
      buildExecLine({
        execPath: '/tmp/.mount_DyingAbc/dying-star-launcher',
        appImage: '/home/p/ds.AppImage',
        appImageRunner: '/run/current-system/sw/bin/appimage-run'
      })
    ).toBe('/run/current-system/sw/bin/appimage-run /home/p/ds.AppImage %U')
  })
})
