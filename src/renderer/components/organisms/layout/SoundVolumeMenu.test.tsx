import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSoundStore } from '@stores/sound'
import SoundVolumeMenu from './SoundVolumeMenu'

beforeEach(() => {
  act(() => useSoundStore.setState({ enabled: true, masterVolume: 0.5 }))
})

describe('SoundVolumeMenu', () => {
  it('toggles the sounds on click', async () => {
    render(<SoundVolumeMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sounds' }))
    expect(useSoundStore.getState().enabled).toBe(false)
  })

  it('opens the volume slider on hover', async () => {
    render(<SoundVolumeMenu />)
    const toggle = screen.getByRole('button', { name: 'Toggle sounds' })
    await userEvent.hover(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('50')
  })
})
