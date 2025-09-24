import useSWR from 'swr';
import { hybridMarketOverviewFetcher, hybridIndicatorFetcher } from '@/lib/hybrid-fetcher';

// Types for cached market data
interface CachedMarketDataConfig {
  maxAge?: number;          // Cache maximum age (seconds)
  refreshInterval?: number; // SWR refresh interval (milliseconds)
  forceRefresh?: boolean;   // Force refresh
  indicatorType?: string;   // Specific indicator type to fetch
}

interface MarketDataFreshness {
  ageInSeconds: number;
  ageInHours: number;
  freshness: number;
  isStale: boolean;
}

interface CachedMarketData {
  id?: number;
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  created_at: string;
  expires_at?: string;
  age_seconds?: number;
  source?: 'cache' | 'realtime' | 'fallback';
  freshness?: MarketDataFreshness;
}

interface MarketOverviewResponse {
  fearGreedIndex?: CachedMarketData;
  economicIndicators?: CachedMarketData[];
  marketIndicators?: CachedMarketData[];
  sp500Data?: CachedMarketData;
  vixData?: CachedMarketData;
  lastUpdated: string;
  source: 'cache' | 'mixed' | 'realtime';
  cacheInfo: {
    totalIndicators: number;
    freshIndicators: number;
    staleIndicators: number;
    cacheHitRate: number;
  };
}

interface CachedMarketDataHookResult {
  marketData: MarketOverviewResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  isCacheData: boolean;
  isRealtimeData: boolean;
  lastUpdated?: string;
  freshness?: MarketDataFreshness;
  forceRefresh: () => Promise<MarketOverviewResponse | undefined>;
  cacheInfo: {
    maxAge: number;
    refreshInterval: number;
    source: string;
    hitRate?: number;
  };
}

export const useCachedMarketData = (config: CachedMarketDataConfig = {}): CachedMarketDataHookResult => {
  // Default settings (environment variable based)
  const defaultMaxAge = parseInt(process.env.NEXT_PUBLIC_CACHE_MAX_AGE_HOURS || '12') * 3600;
  const defaultRefreshInterval = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES || '5') * 60000;

  const fetcher = async (): Promise<MarketOverviewResponse> => {
    try {
      console.log('🔄 Fetching market data (hybrid mode)...');

      // Use hybrid fetcher - automatically chooses between Direct API and Edge Functions
      const result = await hybridMarketOverviewFetcher();

      console.log(`✅ Market data fetched: ${result.cacheInfo.totalIndicators} indicators (source: ${result.source})`);

      return result;
    } catch (error) {
      console.error('❌ Hybrid market data fetch error:', error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    ['cached-market-overview', config.maxAge, config.forceRefresh],
    fetcher,
    {
      refreshInterval: config.refreshInterval || defaultRefreshInterval,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      dedupingInterval: 60000,  // 1 minute deduplication
      // Maintain existing data on error
      errorRetryInterval: 30000,
      shouldRetryOnError: (error) => {
        // Only retry network errors
        return !error?.message?.includes('404');
      },
      // Cache data for better offline experience
      keepPreviousData: true
    }
  );

  // Force refresh function
  const forceRefresh = async (): Promise<MarketOverviewResponse | undefined> => {
    console.log('🔄 Force refreshing market data (hybrid mode)...');

    try {
      const result = await mutate(
        hybridMarketOverviewFetcher(),
        { revalidate: false }
      );

      console.log('✅ Force refresh completed (hybrid mode)');
      return result;
    } catch (error) {
      console.error('❌ Force refresh failed (hybrid mode):', error);
      throw error;
    }
  };

  // Data freshness calculation
  const getDataFreshness = (): MarketDataFreshness | undefined => {
    if (!data?.lastUpdated) return undefined;

    const lastUpdated = new Date(data.lastUpdated);
    const ageInSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    const maxAge = config.maxAge || defaultMaxAge;

    return {
      ageInSeconds,
      ageInHours: Math.floor(ageInSeconds / 3600),
      freshness: Math.max(0, 100 - (ageInSeconds / maxAge) * 100),
      isStale: ageInSeconds > maxAge
    };
  };

  return {
    marketData: data,
    isLoading,
    error,
    isCacheData: data?.source === 'cache',
    isRealtimeData: data?.source === 'realtime',
    lastUpdated: data?.lastUpdated,
    freshness: getDataFreshness(),
    forceRefresh,
    // Cache status information
    cacheInfo: {
      maxAge: config.maxAge || defaultMaxAge,
      refreshInterval: config.refreshInterval || defaultRefreshInterval,
      source: data?.source || 'unknown',
      hitRate: data?.cacheInfo?.cacheHitRate
    }
  };
};

// Hook for specific market indicators
export const useCachedIndicator = (indicatorType: string, config: CachedMarketDataConfig = {}) => {
  const fetcher = async (): Promise<CachedMarketData | null> => {
    try {
      console.log(`🔍 Fetching ${indicatorType} (hybrid mode)...`);

      // Use hybrid fetcher for individual indicators
      const result = await hybridIndicatorFetcher(indicatorType);

      console.log(`✅ ${indicatorType} data fetched (hybrid mode)`);
      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${indicatorType} (hybrid mode):`, error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    ['cached-indicator', indicatorType, config.maxAge, config.forceRefresh],
    fetcher,
    {
      refreshInterval: config.refreshInterval || parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES || '5') * 60000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      dedupingInterval: 60000,
      keepPreviousData: true
    }
  );

  return {
    data,
    isLoading,
    error,
    refresh: mutate,
    isCached: data?.source === 'cache',
    isStale: data?.freshness?.isStale,
    ageInHours: data?.freshness?.ageInHours
  };
};