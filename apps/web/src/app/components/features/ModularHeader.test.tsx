import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import { ModularHeader } from './ModularHeader'

// Mock the API call
jest.mock('../../../lib/api', () => ({
  getAllStocks: jest.fn(() => Promise.resolve([
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
  ]))
}))

describe('ModularHeader Component', () => {
  it('should render all header components', async () => {
    render(<ModularHeader />)

    // Logo components
    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('Investie')).toBeInTheDocument()
    expect(screen.getByText('AI Investment Analysis')).toBeInTheDocument()

    // Stock display (should show default AAPL from StockProvider)
    expect(screen.getByText('Analyzing:')).toBeInTheDocument()

    // Stock selector
    expect(screen.getByText('Change Stock')).toBeInTheDocument()

    // Search bar
    expect(screen.getByPlaceholderText('Search stocks by symbol or name...')).toBeInTheDocument()
  })

  it('should have proper header structure', () => {
    const { container } = render(<ModularHeader />)

    expect(container.querySelector('.modern-header')).toBeInTheDocument()
    expect(container.querySelector('.header-logo')).toBeInTheDocument()
    expect(container.querySelector('.header-controls')).toBeInTheDocument()
  })

  it('should load stock data on mount', async () => {
    render(<ModularHeader />)

    // Wait for async data loading
    await waitFor(() => {
      const button = screen.getByText('Change Stock')
      fireEvent.click(button)
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })
  })

  it('should handle stock selection from dropdown', async () => {
    render(<ModularHeader />)

    await waitFor(() => {
      const changeButton = screen.getByText('Change Stock')
      fireEvent.click(changeButton)
    })

    const tslaOption = screen.getByText('TSLA')
    fireEvent.click(tslaOption)

    // Verify the display updates (would need actual stock context integration)
    await waitFor(() => {
      expect(screen.queryByText('Popular Stocks')).not.toBeInTheDocument()
    })
  })

  it('should handle search functionality', async () => {
    render(<ModularHeader />)

    const searchInput = screen.getByPlaceholderText('Search stocks by symbol or name...')
    fireEvent.change(searchInput, { target: { value: 'Apple' } })

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
  })
})