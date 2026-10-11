import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import DetailPageLayout from './DetailPageLayout'

const box = (el: Element): DOMRect => el.getBoundingClientRect()

describe('DetailPageLayout (rendering)', () => {
  it('gives the main column the whole width when there is no aside', () => {
    render(<DetailPageLayout header={<h1>Edit</h1>} main={<form aria-label="Profile" />} />)
    const header = box(screen.getByRole('heading', { name: 'Edit' }))
    const form = box(screen.getByRole('form', { name: 'Profile' }))
    expect(form.left).toBe(header.left)
    expect(form.width).toBe(header.width)
  })

  it('splits main and aside two thirds / one third', () => {
    render(
      <DetailPageLayout
        header={<h1>Kira</h1>}
        main={<section aria-label="About" />}
        aside={<section aria-label="Affiliations" />}
      />
    )
    const header = box(screen.getByRole('heading', { name: 'Kira' }))
    const main = box(screen.getByRole('region', { name: 'About' }))
    const aside = box(screen.getByRole('region', { name: 'Affiliations' }))
    expect(main.left).toBe(header.left)
    expect(aside.right).toBe(header.right)
    expect(main.width).toBeCloseTo(aside.width * 2, 0)
  })
})
