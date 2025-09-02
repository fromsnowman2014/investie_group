import React from 'react'
import { render, screen, fireEvent } from '@/test-utils'
import { StockSelector } from './StockSelector'
import { StockSymbol } from '@/types/api'

const mockSymbols: StockSymbol[] = ['AAPL', 'TSLA', 'MSFT']

describe('StockSelector Component', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render selector button', () => {
    render(
      <StockSelector 
        symbols={mockSymbols}
        currentSymbol="AAPL"
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Change Stock')).toBeInTheDocument()
  })

  it('should show dropdown when button is clicked', () => {
    render(
      <StockSelector 
        symbols={mockSymbols}
        currentSymbol="AAPL"
        onSelect={mockOnSelect}
      />
    )

    const button = screen.getByText('Change Stock')
    fireEvent.click(button)

    expect(screen.getByText('Popular Stocks')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
    expect(screen.getByText('MSFT')).toBeInTheDocument()
  })

  it('should call onSelect when stock is selected', () => {
    render(
      <StockSelector 
        symbols={mockSymbols}
        currentSymbol="AAPL"
        onSelect={mockOnSelect}
      />
    )

    const button = screen.getByText('Change Stock')
    fireEvent.click(button)

    const tslaOption = screen.getByText('TSLA')
    fireEvent.click(tslaOption)

    expect(mockOnSelect).toHaveBeenCalledWith('TSLA')
  })

  it('should show current symbol as selected', () => {
    render(
      <StockSelector 
        symbols={mockSymbols}
        currentSymbol="TSLA"
        onSelect={mockOnSelect}
      />
    )

    const button = screen.getByText('Change Stock')
    fireEvent.click(button)

    const selectedItem = screen.getByText('TSLA').parentElement
    expect(selectedItem).toHaveClass('selected')
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('should close dropdown when stock is selected', () => {
    render(
      <StockSelector 
        symbols={mockSymbols}
        currentSymbol="AAPL"
        onSelect={mockOnSelect}
      />
    )

    const button = screen.getByText('Change Stock')
    fireEvent.click(button)
    
    expect(screen.getByText('Popular Stocks')).toBeInTheDocument()

    const tslaOption = screen.getByText('TSLA')
    fireEvent.click(tslaOption)

    expect(screen.queryByText('Popular Stocks')).not.toBeInTheDocument()
  })
})