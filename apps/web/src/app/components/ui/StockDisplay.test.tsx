import React from 'react'
import { render, screen } from '@/test-utils'
import { StockDisplay } from './StockDisplay'

describe('StockDisplay Component', () => {
  it('should render with default label and symbol', () => {
    render(<StockDisplay symbol="AAPL" />)

    expect(screen.getByText('Analyzing:')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('should render with custom label', () => {
    render(<StockDisplay symbol="TSLA" label="Current Stock:" />)

    expect(screen.getByText('Current Stock:')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<StockDisplay symbol="MSFT" className="custom-display" />)

    expect(container.firstChild).toHaveClass('custom-display')
    expect(container.firstChild).toHaveClass('current-stock-display')
  })

  it('should render symbol in correct element', () => {
    render(<StockDisplay symbol="GOOGL" />)

    const symbolElement = screen.getByText('GOOGL')
    expect(symbolElement).toHaveClass('stock-symbol')
  })

  it('should render label in correct element', () => {
    render(<StockDisplay symbol="AMZN" label="Tracking:" />)

    const labelElement = screen.getByText('Tracking:')
    expect(labelElement).toHaveClass('stock-label')
  })
})