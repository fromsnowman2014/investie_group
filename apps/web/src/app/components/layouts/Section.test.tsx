import React from 'react'
import { render, screen } from '@/test-utils'
import { Section } from './Section'

describe('Section Component', () => {
  it('should render with title and content', () => {
    const testContent = <div data-testid="test-content">Test Content</div>
    
    render(
      <Section title="Test Section" icon="📊">
        {testContent}
      </Section>
    )

    expect(screen.getByText('📊 Test Section')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('should render without icon', () => {
    render(
      <Section title="Test Section">
        <div>Content</div>
      </Section>
    )

    expect(screen.getByText('Test Section')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <Section title="Test" className="custom-class">
        <div>Content</div>
      </Section>
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should render as different HTML element when specified', () => {
    render(
      <Section title="Test" as="article">
        <div>Content</div>
      </Section>
    )

    expect(screen.getByRole('article')).toBeInTheDocument()
  })
})