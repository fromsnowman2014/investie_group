import React from 'react'
import { render, screen, fireEvent } from '@/test-utils'
import { StockSearchBar } from './StockSearchBar'
import { StockSymbol } from '@/types/api'

const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
]

describe('StockSearchBar Component', () => {
  const mockOnSelect = jest.fn()
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search input', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    expect(screen.getByPlaceholderText('Search stocks by symbol or name...')).toBeInTheDocument()
  })

  it('should filter stocks as user types', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(input, { target: { value: 'AAPL' } })

    expect(screen.getByText('Search Results')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.queryByText('TSLA')).not.toBeInTheDocument()
  })

  it('should show results when typing partial matches', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(input, { target: { value: 'Apple' } })

    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
  })

  it('should call onSelect when stock is clicked', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(input, { target: { value: 'TSLA' } })

    const tslaResult = screen.getByText('TSLA')
    fireEvent.click(tslaResult)

    expect(mockOnSelect).toHaveBeenCalledWith('TSLA')
  })

  it('should call onSearch when form is submitted', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(input, { target: { value: 'AAPL' } })
    fireEvent.submit(input.closest('form')!)

    expect(mockOnSearch).toHaveBeenCalledWith('AAPL')
  })

  it('should clear search query when stock is selected', () => {
    render(
      <StockSearchBar 
        stocks={mockStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'TSLA' } })
    
    expect(input.value).toBe('TSLA')

    const tslaResult = screen.getByText('TSLA')
    fireEvent.click(tslaResult)

    expect(input.value).toBe('')
  })

  it('should limit results to 5 items', () => {
    const manyStocks = Array.from({ length: 10 }, (_, i) => ({
      symbol: `STOCK${i}` as StockSymbol,
      name: `Stock Company ${i}`,
    }))

    render(
      <StockSearchBar 
        stocks={manyStocks}
        onSelect={mockOnSelect}
        onSearch={mockOnSearch}
      />
    )

    const input = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(input, { target: { value: 'STOCK' } })

    const results = screen.getAllByText(/STOCK\d/)
    expect(results).toHaveLength(5)
  })
})