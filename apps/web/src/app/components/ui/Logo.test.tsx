import React from 'react'
import { render, screen } from '@/test-utils'
import { Logo } from './Logo'

describe('Logo Component', () => {
  it('should render logo with icon and text', () => {
    render(<Logo />)

    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('Investie')).toBeInTheDocument()
    expect(screen.getByText('AI Investment Analysis')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Logo className="custom-logo" />)

    expect(container.firstChild).toHaveClass('custom-logo')
    expect(container.firstChild).toHaveClass('header-logo')
  })

  it('should render with custom icon', () => {
    render(<Logo icon="💹" />)

    expect(screen.getByText('💹')).toBeInTheDocument()
    expect(screen.getByText('Investie')).toBeInTheDocument()
  })

  it('should render with custom title', () => {
    render(<Logo title="Custom Title" />)

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('should render with custom subtitle', () => {
    render(<Logo subtitle="Custom Subtitle" />)

    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument()
  })
})