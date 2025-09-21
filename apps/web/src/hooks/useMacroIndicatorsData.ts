import useSWR from 'swr';
import { MarketOverviewData } from '@/types/api';
import { edgeFunctionFetcher } from '@/lib/api-utils';

// Import proper interfaces from shared cache module to avoid duplication
interface MarketOverviewResponse {
  fearGreedIndex?: CachedMarketData;
  economicIndicators?: CachedMarketData[];
  marketIndicators?: CachedMarketData[];
  sp500Data?: CachedMarketData;
  nasdaqData?: CachedMarketData;
  dowData?: CachedMarketData;
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

interface CachedMarketData {
  id?: number;
  indicator_type: string;
  data_value: MarketDataValue;
  metadata?: Record<string, unknown>;
  data_source: string;
  created_at: string;
  expires_at?: string;
  age_seconds?: number;
  source?: 'cache' | 'realtime' | 'fallback';
}

// Define proper structure for market data values
interface MarketDataValue {
  price?: number;
  value?: number;
  change?: number;
  changePercent?: number;
  previousClose?: number;
  volume?: number;
  marketCap?: number;
}

// Check if market is open (simplified - US Eastern time)
const checkMarketHours = (): boolean => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();

  // Market open Mon-Fri 9:30 AM to 4:00 PM EST (simplified to 9-16)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
};

// Helper function to determine market sentiment based on cached data
const determineSentiment = (data: MarketOverviewResponse): 'bullish' | 'bearish' | 'neutral' => {
  try {
    const sp500Change = data.sp500Data?.data_value.changePercent || 0;
    const nasdaqChange = data.nasdaqData?.data_value.changePercent || 0;
    const dowChange = data.dowData?.data_value.changePercent || 0;

    const averageChange = (sp500Change + nasdaqChange + dowChange) / 3;

    if (averageChange > 0.5) return 'bullish';
    if (averageChange < -0.5) return 'bearish';
    return 'neutral';
  } catch {
    return 'neutral';
  }
};

// Helper function to calculate data age in hours
const calculateDataAge = (lastUpdated?: string): number => {
  if (!lastUpdated) return 0;

  try {
    const updateTime = new Date(lastUpdated);
    const now = new Date();
    const ageInHours = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60));
    return Math.max(0, ageInHours);
  } catch {
    return 0;
  }
};

const fetcher = async (): Promise<MarketOverviewData> => {
  try {
    // Try to use database-reader cache first (restored from f717bd3 implementation)
    console.log('🔄 Attempting to fetch cached market data from database-reader...');

    try {
      const cachedResult = await edgeFunctionFetcher<MarketOverviewResponse>('database-reader', {
        action: 'get_market_overview',
        maxAge: 12 * 3600, // 12 hours
        fallbackToAPI: true,
        forceRefresh: false
      });

      if (cachedResult && cachedResult.cacheInfo) {
        console.log(`✅ Got cached data from database-reader (${cachedResult.cacheInfo.cacheHitRate}% cache hit rate)`);

        // Convert cached format to expected format with type safety
        // Helper function to safely extract market data
        const extractMarketData = (data?: CachedMarketData, fallbackValue = 0) => ({
          value: data?.data_value.price || data?.data_value.value || fallbackValue,
          change: data?.data_value.change || 0,
          changePercent: data?.data_value.changePercent || 0
        });

        const adaptedData: MarketOverviewData = {
          indices: {
            sp500: extractMarketData(cachedResult.sp500Data, 4500),
            nasdaq: extractMarketData(cachedResult.nasdaqData, 14000),
            dow: extractMarketData(cachedResult.dowData, 35000)
          },
          sectors: [], // TODO: Implement sector data extraction when available
          volatilityIndex: cachedResult.vixData?.data_value.price ||
                           cachedResult.vixData?.data_value.value || 20,
          marketSentiment: determineSentiment(cachedResult),
          source: cachedResult.source || 'cache',
          lastUpdated: cachedResult.lastUpdated || new Date().toISOString(),
          cacheInfo: {
            isFromCache: true,
            cacheHitRate: cachedResult.cacheInfo.cacheHitRate,
            totalIndicators: cachedResult.cacheInfo.totalIndicators,
            freshIndicators: cachedResult.cacheInfo.freshIndicators,
            dataAge: calculateDataAge(cachedResult.lastUpdated)
          }
        };

        return adaptedData;
      }
    } catch (cacheError) {
      const errorMessage = cacheError instanceof Error ? cacheError.message : 'Unknown error';
      console.warn('⚠️ Database-reader failed, falling back to market-overview:', errorMessage);
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