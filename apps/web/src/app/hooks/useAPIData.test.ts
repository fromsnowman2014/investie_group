import { renderHook } from '@testing-library/react'
import { useAPIData, useStockData, useStockProfile, useAIAnalysis, useMarketOverview, useNewsAnalysis } from './useAPIData'

// Mock SWR
jest.mock('swr', () => jest.fn())

// Mock API utils
jest.mock('@/lib/api-utils', () => ({
  debugFetch: jest.fn()
}))

describe('useAPIData', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseSWR = require('swr')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return SWR state with default options', () => {
    const mockSWRReturn = {
      data: { test: 'data' },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    }

    mockUseSWR.mockReturnValue(mockSWRReturn)

    const { result } = renderHook(() => useAPIData('/test-url'))

    expect(result.current).toEqual(mockSWRReturn)
    expect(mockUseSWR).toHaveBeenCalledWith(
      '/test-url',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 300000,
        revalidateOnFocus: true,
        shouldRetryOnError: true,
        errorRetryCount: 3,
        dedupingInterval: 60000
      })
    )
  })

  it('should handle null URL', () => {
    const mockSWRReturn = {
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    }

    mockUseSWR.mockReturnValue(mockSWRReturn)

    const { result } = renderHook(() => useAPIData(null))

    expect(result.current).toEqual(mockSWRReturn)
    expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.any(Object))
  })

  it('should accept custom options', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    })

    const customOptions = {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      errorRetryCount: 5
    }

    renderHook(() => useAPIData('/test-url', customOptions))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/test-url',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 60000,
        revalidateOnFocus: false,
        errorRetryCount: 5
      })
    )
  })
})

describe('Specialized API hooks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseSWR = require('swr')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn()
    })
  })

  it('useStockData should use correct URL and options', () => {
    renderHook(() => useStockData('AAPL'))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/v1/stocks/AAPL',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 60000,
        errorRetryCount: 5
      })
    )
  })

  it('useStockProfile should use correct URL and options', () => {
    renderHook(() => useStockProfile('AAPL'))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/v1/dashboard/AAPL/profile',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 300000,
        revalidateOnFocus: false
      })
    )
  })

  it('useAIAnalysis should use correct URL and options', () => {
    renderHook(() => useAIAnalysis('AAPL'))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/v1/dashboard/AAPL/ai-analysis',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 600000,
        revalidateOnFocus: false
      })
    )
  })

  it('useMarketOverview should use correct URL', () => {
    renderHook(() => useMarketOverview())

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/v1/market/overview',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 300000,
        errorRetryCount: 5
      })
    )
  })

  it('useNewsAnalysis should use correct URL and options', () => {
    renderHook(() => useNewsAnalysis('today'))

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/v1/news/macro/today',
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 900000,
        revalidateOnFocus: false,
        errorRetryCount: 3
      })
    )
  })

  it('should handle null symbol/endpoint correctly', () => {
    renderHook(() => useStockData(null))
    renderHook(() => useStockProfile(null))
    renderHook(() => useAIAnalysis(null))
    renderHook(() => useNewsAnalysis(''))

    // Should be called with null for first three
    expect(mockUseSWR).toHaveBeenNthCalledWith(1, null, expect.any(Function), expect.any(Object))
    expect(mockUseSWR).toHaveBeenNthCalledWith(2, null, expect.any(Function), expect.any(Object))
    expect(mockUseSWR).toHaveBeenNthCalledWith(3, null, expect.any(Function), expect.any(Object))
    expect(mockUseSWR).toHaveBeenNthCalledWith(4, null, expect.any(Function), expect.any(Object))
  })
})