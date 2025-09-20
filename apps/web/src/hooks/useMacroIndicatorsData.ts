import useSWR from 'swr';
import { MarketOverviewData, ApiResponse } from '@/types/api';
import { edgeFunctionFetcher } from '@/lib/api-utils';

// Check if market is open (simplified - US Eastern time)
const checkMarketHours = (): boolean => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();
  
  // Market open Mon-Fri 9:30 AM to 4:00 PM EST (simplified to 9-16)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
};

const fetcher = async (): Promise<MarketOverviewData> => {
  try {
    // Try to use database-reader cache first (restored from f717bd3 implementation)
    console.log('🔄 Attempting to fetch cached market data from database-reader...');

    try {
      const cachedResult = await edgeFunctionFetcher('database-reader', {
        action: 'get_market_overview',
        maxAge: 12 * 3600, // 12 hours
        fallbackToAPI: true,
        forceRefresh: false
      });

      if (cachedResult && cachedResult.cacheInfo) {
        console.log(`✅ Got cached data from database-reader (${cachedResult.cacheInfo.cacheHitRate}% cache hit rate)`);

        // Convert cached format to expected format
        // This is a temporary adapter - in production, we should align data formats
        const adaptedData = {
          indices: {
            sp500: {
              value: cachedResult.sp500Data?.data_value?.price || 4500,
              change: cachedResult.sp500Data?.data_value?.change || 0,
              changePercent: cachedResult.sp500Data?.data_value?.changePercent || 0
            },
            nasdaq: { value: 14000, change: 0, changePercent: 0 },
            dow: { value: 35000, change: 0, changePercent: 0 }
          },
          sectors: [],
          volatilityIndex: cachedResult.vixData?.data_value?.price || 20,
          marketSentiment: 'neutral',
          source: cachedResult.source || 'cache'
        };

        return adaptedData as MarketOverviewData;
      }
    } catch (cacheError) {
      console.warn('⚠️ Database-reader failed, falling back to market-overview:', cacheError.message);
    }

    // Fallback to market-overview if cache fails
    console.log('🔍 Falling back to market-overview direct API...');

    const result = await edgeFunctionFetcher('market-overview', {});

    if (result) {
      console.log('✅ Got market data from market-overview fallback');
      return result as MarketOverviewData;
    }

    throw new Error('No data received from either cache or fallback API');
  } catch (error) {
    console.error('MacroIndicators Fetcher Error:', error);
    throw error;
  }
};

export const useMacroIndicatorsData = () => {
  const isMarketOpen = checkMarketHours();
  
  const { data, error, isLoading, mutate } = useSWR(
    'cached-market-overview',
    fetcher,
    { 
      refreshInterval: isMarketOpen ? 300000 : 0, // 5 minutes when market is open, no refresh when closed
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Stop refreshing when market is closed or when tab is hidden
      refreshWhenHidden: false
    }
  );
  
  return {
    marketData: data,
    isLoading,
    error,
    isEmpty: !data && !isLoading && !error,
    isMarketOpen,
    refetch: mutate,
    lastUpdated: data?.source ? new Date().toISOString() : undefined
  };
};