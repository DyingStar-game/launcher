import { describe, expect, it } from 'vitest'
import { gameArgs } from './gameArgs'

describe('gameArgs', () => {
  it('passes the token and asks for accurate breadcrumbs', () => {
    expect(gameArgs('header.payload.signature')).toEqual([
      '--token=header.payload.signature',
      '--accurate-breadcrumbs'
    ])
  })
})
