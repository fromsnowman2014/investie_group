import React from 'react'
import { render, screen } from '@/test-utils'
import StockProfile from './StockProfile'

// Mock the API utility
jest.mock('../../../lib/api-utils', () => ({
  debugFetch: jest.fn()
}))

// Mock SWR
jest.mock('swr', () => jest.fn())

// Mock FinancialExpandableSection
jest.mock('../FinancialExpandableSection', () => {
  return function MockFinancialExpandableSection({ 
    title, 
    children 
  }: { 
    title: string
    children: React.ReactNode 
  }) {
    return (
      <div data-testid="financial-expandable-section">
        <h3>{title}</h3>
        {children}
      </div>
    )
  }
})

const mockStockData = {
  symbol: 'AAPL',
  companyName: 'Apple Inc.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  country: 'United States',
  marketCap: 3000000000000,
  peRatio: 25.5,
  dividendYield: 0.005,
  description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
  employees: 164000,
  founded: '1976',
  headquarters: 'Cupertino, CA',
  website: 'https://www.apple.com'
}

describe('StockProfile Component', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseSWR = require('swr')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true
    })

    const { container } = render(<StockProfile symbol="AAPL" />)

    expect(container.querySelector('.stock-profile-loading')).toBeInTheDocument()
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
      isLoading: false
    })

    render(<StockProfile symbol="AAPL" />)

    expect(screen.getByText('⚠️')).toBeInTheDocument()
    expect(screen.getByText('Unable to load stock profile')).toBeInTheDocument()
    expect(screen.getByText('Please check the symbol and try again')).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false
    })

    render(<StockProfile symbol="AAPL" />)

    expect(screen.getByText('📊')).toBeInTheDocument()
    expect(screen.getByText('Select a stock symbol to view profile')).toBeInTheDocument()
  })

  it('should render stock profile data correctly', () => {
    mockUseSWR.mockReturnValue({
      data: mockStockData,
      error: undefined,
      isLoading: false
    })

    render(<StockProfile symbol="AAPL" />)

    // Company header
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Consumer Electronics')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()

    // Key metrics
    expect(screen.getByText('Market Cap')).toBeInTheDocument()
    expect(screen.getByText('$3.00T')).toBeInTheDocument()
    expect(screen.getByText('P/E Ratio')).toBeInTheDocument()
    expect(screen.getByText('25.50')).toBeInTheDocument()
    expect(screen.getByText('Dividend Yield')).toBeInTheDocument()
    expect(screen.getByText('0.50%')).toBeInTheDocument()

    // Company information section
    expect(screen.getByText('Company Information')).toBeInTheDocument()
  })

  it('should format market cap correctly', () => {
    const testCases = [
      { ...mockStockData, marketCap: 3000000000000, expected: '$3.00T' },
      { ...mockStockData, marketCap: 50000000000, expected: '$50.00B' },
      { ...mockStockData, marketCap: 1000000000, expected: '$1.00B' },
      { ...mockStockData, marketCap: 500000000, expected: '$500.00M' }
    ]

    testCases.forEach(testCase => {
      mockUseSWR.mockReturnValue({
        data: testCase,
        error: undefined,
        isLoading: false
      })

      render(<StockProfile symbol="AAPL" />)
      expect(screen.getByText(testCase.expected)).toBeInTheDocument()
    })
  })

  it('should handle missing optional data', () => {
    const incompleteData = {
      ...mockStockData,
      peRatio: null,
      dividendYield: null,
      website: null
    }

    mockUseSWR.mockReturnValue({
      data: incompleteData,
      error: undefined,
      isLoading: false
    })

    render(<StockProfile symbol="AAPL" />)

    expect(screen.getAllByText('N/A')).toHaveLength(2) // P/E Ratio and Dividend Yield
    expect(screen.queryByText('Website')).not.toBeInTheDocument()
  })
})