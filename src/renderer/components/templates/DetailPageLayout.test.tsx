import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import DetailPageLayout from './DetailPageLayout'

describe('DetailPageLayout', () => {
  it('places back, header, stats, main and aside', () => {
    render(
      <DetailPageLayout
        back={<button>Back</button>}
        header={<h1>Name</h1>}
        stats={<p>Stats</p>}
        main={<p>Main</p>}
        aside={<p>Aside</p>}
      />
    )
    for (const text of ['Back', 'Name', 'Stats', 'Main', 'Aside']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })

  it('shows the placeholder instead of the body', () => {
    render(
      <DetailPageLayout
        back={<button>Back</button>}
        header={<h1>Name</h1>}
        main={<p>Main</p>}
        placeholder={<p>Loading</p>}
      />
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
  })
})

describe('DetailPageLayout scroll container', () => {
  it('hands its scrolling element to scrollRef', () => {
    let el: HTMLDivElement | null = null
    render(<DetailPageLayout header={<h1>Name</h1>} scrollRef={(node) => void (el = node)} />)
    expect(el).toHaveClass('overflow-y-auto')
  })
})
