import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import ServerStatus from './ServerStatus'

describe('ServerStatus', () => {
  it('pulses in the status colour while live', () => {
    const { container } = render(<ServerStatus status="online" />)
    expect(container.querySelector('.animate-ping')).toHaveClass('bg-emerald-400')
  })

  it('stays still when offline', () => {
    const { container } = render(<ServerStatus status="offline" />)
    expect(container.querySelector('.animate-ping')).toBeNull()
    expect(container.querySelector('.bg-red-500')).not.toBeNull()
  })
})
