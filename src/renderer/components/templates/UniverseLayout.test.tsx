import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import UniverseLayout from './UniverseLayout'

describe('UniverseLayout', () => {
  it('shows banner, alert and the four panels', () => {
    render(
      <UniverseLayout
        banner={<p>Banner</p>}
        alert={<p>Alert</p>}
        panels={[<p key="1">A</p>, <p key="2">B</p>, <p key="3">C</p>, <p key="4">D</p>]}
      />
    )
    for (const text of ['Banner', 'Alert', 'A', 'B', 'C', 'D']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })

  it('omits the alert wrapper without an alert', () => {
    const { container } = render(
      <UniverseLayout
        panels={[<p key="1">A</p>, <p key="2">B</p>, <p key="3">C</p>, <p key="4">D</p>]}
      />
    )
    expect(container.querySelector('.pt-3')).toBeNull()
  })
})
