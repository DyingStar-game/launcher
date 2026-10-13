import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '../../../test/render'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import GameFilesPopover from './GameFilesPopover'

const savedFiles = useFilesStore.getState()

afterEach(() => act(() => useFilesStore.setState(savedFiles, true)))

describe('GameFilesPopover (rendering)', () => {
  it('puts its two buttons side by side, sharing the whole width', () => {
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
      useFilesStore.setState((s) => ({
        data: {
          ...s.data,
          'universe-testing': {
            ...s.data['universe-testing'],
            installed: true,
            installPath: '/games',
            version: '20261012000000'
          }
        }
      }))
    })
    render(<GameFilesPopover open onOpenChange={() => {}} />)
    const field = screen.getByRole('textbox', { name: 'Install folder' }).getBoundingClientRect()
    const browse = screen.getByRole('button', { name: 'Browse' }).getBoundingClientRect()
    const detect = screen
      .getByRole('button', { name: 'Detect installation' })
      .getBoundingClientRect()
    const clear = screen.getByRole('button', { name: 'Clear cache' }).getBoundingClientRect()
    // The panel zooms in as it opens: compare to the pixel
    expect(clear.top).toBeCloseTo(detect.top, 0)
    expect(clear.width).toBeCloseTo(detect.width, 0)
    // From the field's left edge to the Browse button's right edge
    expect(detect.left).toBeCloseTo(field.left, 0)
    expect(clear.right).toBeCloseTo(browse.right, 0)
  })
})
