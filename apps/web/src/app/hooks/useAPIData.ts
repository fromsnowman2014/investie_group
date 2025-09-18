import useSWR from 'swr'
import { edgeFunctionFetcher } from '@/lib/api-utils'

interface UseAPIDataOptions {
  refreshInterval?: number
  revalidateOnFocus?: boolean
  shouldRetryOnError?: boolean
  errorRetryCount?: number
}

interface APIDataState<T> {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T, shouldRevalidate?: boolean) => Promise<T | undefined>
}

const defaultFetcher = async <T = unknown>(endpoint: string): Promise<T> => {
  const data = await edgeFunctionFetcher<T>(endpoint)
  return data
}

export function useAPIData<T = unknown>(
  url: string | null,
  options: UseAPIDataOptions = {}
): APIDataState<T> {
  const {
    refreshInterval = 300000, // 5 minutes default
    revalidateOnFocus = true,
    shouldRetryOnError = true,
    errorRetryCount = 3
  } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    (endpoint: string) => defaultFetcher<T>(endpoint),
    {
      refreshInterval,
      revalidateOnFocus,
      shouldRetryOnError,
      errorRetryCount,
      dedupingInterval: 60000 // 1 minute deduping
    }
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  }
}

// Specialized hooks for common API patterns

export function useStockData(symbol: string | null) {
  const url = symbol ? `/api/v1/stocks/${symbol}` : null
  
  return useAPIData(url, {
    refreshInterval: 60000, // 1 minute for stock data
    errorRetryCount: 5
  })
}

export function useStockProfile(symbol: string | null) {
  const url = symbol ? `/api/v1/dashboard/${symbol}/profile` : null
  
  return useAPIData(url, {
    refreshInterval: 300000, // 5 minutes for profile data
    revalidateOnFocus: false
  })
}

export function useAIAnalysis(symbol: string | null) {
  const url = symbol ? `/api/v1/dashboard/${symbol}/ai-analysis` : null
  
  return useAPIData(url, {
    refreshInterval: 600000, // 10 minutes for AI analysis
    revalidateOnFocus: false
  })
}

export function useMarketOverview() {
  return useAPIData('/api/v1/market/overview', {
    refreshInterval: 300000, // 5 minutes for market data
    errorRetryCount: 5
  })
}

export function useNewsAnalysis(endpoint: string) {
  const url = endpoint ? `/api/v1/news/macro/${endpoint}` : null
  
  return useAPIData(url, {
    refreshInterval: 900000, // 15 minutes for news
    revalidateOnFocus: false,
    errorRetryCount: 3
  })
}