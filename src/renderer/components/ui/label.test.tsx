import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Label } from './label'

describe('Label', () => {
  it('names the control it is for', () => {
    render(
      <>
        <Label htmlFor="f">Faction</Label>
        <input id="f" />
      </>
    )
    expect(screen.getByRole('textbox', { name: 'Faction' })).toBeInTheDocument()
  })
})
