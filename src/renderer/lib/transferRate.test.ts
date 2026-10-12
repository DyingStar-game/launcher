import { describe, expect, it } from 'vitest'
import { addTransferSample, secondsLeft, transferRate } from './transferRate'

describe('transferRate', () => {
  it('measures bytes per second across the kept samples', () => {
    let samples = addTransferSample([], { at: 0, bytes: 0 })
    samples = addTransferSample(samples, { at: 2000, bytes: 4000 })
    expect(transferRate(samples)).toBe(2000)
  })

  it('forgets samples older than the window', () => {
    let samples = addTransferSample([], { at: 0, bytes: 0 })
    samples = addTransferSample(samples, { at: 4000, bytes: 1000 })
    samples = addTransferSample(samples, { at: 8000, bytes: 9000 })
    expect(samples).toHaveLength(2)
    expect(transferRate(samples)).toBe(2000)
  })

  it('is unknown before time has passed', () => {
    expect(transferRate([])).toBeNull()
    expect(transferRate([{ at: 5, bytes: 10 }])).toBeNull()
  })
})

describe('secondsLeft', () => {
  it('divides what is left by the speed', () => {
    expect(secondsLeft(1000, 5000, 2000)).toBe(2)
  })

  it('is unknown without a speed', () => {
    expect(secondsLeft(1000, 5000, null)).toBeNull()
    expect(secondsLeft(1000, 5000, 0)).toBeNull()
  })
})
