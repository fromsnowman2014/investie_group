import useSWR from 'swr';
import { hybridMarketOverviewFetcher } from '@/lib/hybrid-fetcher';

// Simplified types for real-time market data (no cache dependencies)
interface RealTimeMarketDataConfig {
  refreshInterval?: number; // SWR refresh interval (milliseconds)
  forceRefresh?: boolean;   // Force refresh
}

// Real-time market overview response (matches hybrid-fetcher output)
interface MarketOverviewResponse {
  indices: {
    sp500: { value: number; change: number; changePercent: number };
    nasdaq: { value: number; change: number; changePercent: number };
    dow: { value: number; change: number; changePercent: number };
  };
  sectors: Array<{
    name: string;
    change: number;
    performance: 'positive' | 'negative';
  }>;
  economicIndicators?: Record<string, {
    value: number;
    previousValue?: number;
    change?: number;
    date: string;
    trend: 'rising' | 'falling' | 'stable';
    source: string;
  }>;
  fearGreedIndex?: {
    value: number;
    status: string;
    confidence: number;
  };
  vix?: {
    value: number;
    status: string;
    interpretation: string;
  };
  marketSentiment: string;
  volatilityIndex: number;
  source: string;
  lastUpdated: string;
  timestamp: string;
}

interface RealTimeMarketDataHookResult {
  marketData: MarketOverviewResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  isRealtimeData: boolean;
  lastUpdated?: string;
  forceRefresh: () => Promise<MarketOverviewResponse | undefined>;
}

/**
 * Hook for fetching real-time market data
 * Direct API calls without cache dependencies
 */
export function useRealTimeMarketData(config: RealTimeMarketDataConfig = {}): RealTimeMarketDataHookResult {
  const {
    refreshInterval = 5 * 60 * 1000 // 5 minutes default
  } = config;

  const fetcher = async (): Promise<MarketOverviewResponse> => {
    try {
      console.log('🔄 Fetching market data (real-time mode)...');

      // Use hybrid fetcher - automatically uses real-time API
      const result = await hybridMarketOverviewFetcher();

      console.log(`✅ Market data fetched from ${result.source} at ${result.lastUpdated}`);

      return result;
    } catch (error) {
      console.error('❌ Real-time market data fetch error:', error);
      throw error;
    }
  };

  const forceRefreshData = async (): Promise<MarketOverviewResponse | undefined> => {
    try {
      return await mutate();
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return undefined;
    }
  };

  const {
    data: marketData,
    error,
    isLoading,
    mutate
  } = useSWR('market-overview-data', fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2 * 60 * 1000, // 2 minutes
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.error('💥 Market data SWR error:', error);
    },
    onSuccess: (data) => {
      console.log(`📊 Market data SWR success: ${data.source} data loaded`);
    }
  });

  return {
    marketData,
    isLoading,
    error,
    isRealtimeData: true, // Always real-time now
    lastUpdated: marketData?.lastUpdated,
    forceRefresh: forceRefreshData
  };
}

// Legacy export for backward compatibility
export const useCachedMarketData = useRealTimeMarketData;
export default useRealTimeMarketData;