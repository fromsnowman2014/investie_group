import useSWR from 'swr';
import { hybridMarketOverviewFetcher } from '@/lib/hybrid-fetcher';

// Simplified interface for real-time macro indicators
interface MacroIndicatorsData {
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
  volatilityIndex: number;
  marketSentiment: string;
  source: string;
  lastUpdated: string;
  timestamp: string;
}

/**
 * Hook for fetching macro market indicators data
 * Now uses real-time API data via hybrid fetcher
 */
export function useMacroIndicatorsData() {
  const fetcher = async (): Promise<MacroIndicatorsData> => {
    try {
      console.log('🔄 Fetching macro indicators data (real-time)...');

      // Use hybrid fetcher to get real-time market overview
      const result = await hybridMarketOverviewFetcher();

      console.log(`✅ Macro indicators fetched from ${result.source} at ${result.lastUpdated}`);

      // Transform to simplified macro indicators format
      return {
        indices: result.indices,
        sectors: result.sectors,
        volatilityIndex: result.volatilityIndex,
        marketSentiment: result.marketSentiment,
        source: result.source,
        lastUpdated: result.lastUpdated,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('❌ Macro indicators fetch error:', error);
      throw error;
    }
  };

  const {
    data,
    error,
    isLoading,
    mutate
  } = useSWR('macro-indicators-data', fetcher, {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2 * 60 * 1000, // 2 minutes
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.error('💥 Macro indicators SWR error:', error);
    },
    onSuccess: (data) => {
      console.log(`📊 Macro indicators SWR success: ${data.source} data loaded`);
    }
  });

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
    // Legacy compatibility
    macroData: data,
    isMacroDataLoading: isLoading,
    macroDataError: error
  };
}

export default useMacroIndicatorsData;