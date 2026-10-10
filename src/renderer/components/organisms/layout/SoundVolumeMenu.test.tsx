import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useSoundStore } from '@stores/sound'
import SoundVolumeMenu from './SoundVolumeMenu'

beforeEach(() => {
  act(() => useSoundStore.setState({ enabled: true, masterVolume: 0.5 }))
})

describe('SoundVolumeMenu', () => {
  it('toggles the sounds on click', async () => {
    render(<SoundVolumeMenu />)
    const speaker = screen.getByRole('button', { name: 'Toggle sounds' })
    await userEvent.click(speaker)
    expect(useSoundStore.getState().enabled).toBe(false)
    expect(speaker).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(speaker)
    expect(useSoundStore.getState().enabled).toBe(true)
  })

  it('opens the volume slider on hover without taking the focus', async () => {
    render(<SoundVolumeMenu />)
    await userEvent.hover(screen.getByRole('button', { name: 'Toggle sounds' }))
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '50')
    expect(document.body).toHaveFocus()
  })

  it('opens with the down arrow and sets the volume with the keyboard', async () => {
    render(<SoundVolumeMenu />)
    screen.getByRole('button', { name: 'Toggle sounds' }).focus()
    await userEvent.keyboard('{ArrowDown}')
    screen.getByRole('slider', { name: 'Volume' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(useSoundStore.getState().masterVolume).toBeCloseTo(0.51)
  })

  it('mutes with Enter without opening the slider', async () => {
    render(<SoundVolumeMenu />)
    screen.getByRole('button', { name: 'Toggle sounds' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(useSoundStore.getState().enabled).toBe(false)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('closes on Escape and gives the focus back', async () => {
    render(<SoundVolumeMenu />)
    const speaker = screen.getByRole('button', { name: 'Toggle sounds' })
    speaker.focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(speaker).toHaveFocus()
  })
})
