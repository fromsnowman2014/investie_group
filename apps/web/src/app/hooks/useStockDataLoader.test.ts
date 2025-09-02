import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockDataLoader, useStockSearch, useStockMatcher } from './useStockDataLoader'

// Mock the API
jest.mock('@/lib/api', () => ({
  getAllStocks: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetAllStocks = require('@/lib/api').getAllStocks

const mockStockApiData = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' }
]

describe('useStockDataLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should load stock data successfully', async () => {
    mockGetAllStocks.mockResolvedValue(mockStockApiData)

    const { result } = renderHook(() => useStockDataLoader())

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.stockData).toEqual([])
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stockData).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' }
    ])
    expect(result.current.error).toBe(null)
  })

  it('should handle API error with fallback', async () => {
    const error = new Error('API Error')
    mockGetAllStocks.mockRejectedValue(error)

    const { result } = renderHook(() => useStockDataLoader())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(error)
    expect(result.current.stockData).toEqual([
      { symbol: 'AAPL', name: 'AAPL' },
      { symbol: 'TSLA', name: 'TSLA' },
      { symbol: 'MSFT', name: 'MSFT' },
      { symbol: 'GOOGL', name: 'GOOGL' },
      { symbol: 'AMZN', name: 'AMZN' },
      { symbol: 'NVDA', name: 'NVDA' },
      { symbol: 'META', name: 'META' },
      { symbol: 'NFLX', name: 'NFLX' },
      { symbol: 'AVGO', name: 'AVGO' },
      { symbol: 'AMD', name: 'AMD' }
    ])
  })

  it('should provide reload functionality', async () => {
    mockGetAllStocks.mockResolvedValueOnce(mockStockApiData)

    const { result } = renderHook(() => useStockDataLoader())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetAllStocks).toHaveBeenCalledTimes(1)

    // Call reload
    mockGetAllStocks.mockResolvedValueOnce([...mockStockApiData, { symbol: 'GOOGL', name: 'Alphabet Inc.' }])
    
    act(() => {
      result.current.reload()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetAllStocks).toHaveBeenCalledTimes(2)
  })
})

describe('useStockSearch', () => {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' }
  ]

  it('should return empty array for empty query', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, ''))

    expect(result.current).toEqual([])
  })

  it('should return empty array for whitespace query', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, '   '))

    expect(result.current).toEqual([])
  })

  it('should filter by symbol', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, 'AAPL'))

    expect(result.current).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' }
    ])
  })

  it('should filter by name', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, 'Apple'))

    expect(result.current).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' }
    ])
  })

  it('should be case insensitive', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, 'apple'))

    expect(result.current).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' }
    ])
  })

  it('should filter by partial matches', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, 'inc'))

    expect(result.current).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' }
    ])
  })

  it('should limit results to 5', () => {
    const { result } = renderHook(() => useStockSearch(mockStocks, 'inc'))

    expect(result.current).toHaveLength(5)
  })

  it('should update when query changes', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useStockSearch(mockStocks, query),
      { initialProps: { query: 'AAPL' } }
    )

    expect(result.current).toEqual([
      { symbol: 'AAPL', name: 'Apple Inc.' }
    ])

    rerender({ query: 'TSLA' })

    expect(result.current).toEqual([
      { symbol: 'TSLA', name: 'Tesla, Inc.' }
    ])
  })
})

describe('useStockMatcher', () => {
  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' }
  ]

  it('should find stock by exact symbol match', () => {
    const { result } = renderHook(() => useStockMatcher(mockStocks))

    const stock = result.current.findStock('AAPL')
    expect(stock).toEqual({ symbol: 'AAPL', name: 'Apple Inc.' })
  })

  it('should find stock by case insensitive symbol match', () => {
    const { result } = renderHook(() => useStockMatcher(mockStocks))

    const stock = result.current.findStock('aapl')
    expect(stock).toEqual({ symbol: 'AAPL', name: 'Apple Inc.' })
  })

  it('should find stock by name partial match', () => {
    const { result } = renderHook(() => useStockMatcher(mockStocks))

    const stock = result.current.findStock('Apple')
    expect(stock).toEqual({ symbol: 'AAPL', name: 'Apple Inc.' })
  })

  it('should return null for no match', () => {
    const { result } = renderHook(() => useStockMatcher(mockStocks))

    const stock = result.current.findStock('NONEXISTENT')
    expect(stock).toBeNull()
  })

  it('should be case insensitive for name search', () => {
    const { result } = renderHook(() => useStockMatcher(mockStocks))

    const stock = result.current.findStock('apple')
    expect(stock).toEqual({ symbol: 'AAPL', name: 'Apple Inc.' })
  })
})