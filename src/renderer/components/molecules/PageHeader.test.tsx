import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageHeader from './PageHeader'

describe('PageHeader', () => {
  it('shows title, subtitle and actions', () => {
    render(<PageHeader title="Friends" subtitle="Your friends." actions={<button>Add</button>} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Friends' })).toBeInTheDocument()
    expect(screen.getByText('Your friends.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
