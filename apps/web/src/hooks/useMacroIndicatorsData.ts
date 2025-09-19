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
    // First try to get cached data from database-reader
    console.log('🔍 Fetching market data from cache...');

    const cachedResult = await edgeFunctionFetcher('database-reader', {
      action: 'get_market_overview'
    });

    // Transform cached data to match the expected MarketOverviewData format
    if (cachedResult) {
      console.log(`✅ Cache hit! Got ${cachedResult.cacheInfo?.totalIndicators || 0} indicators from cache`);

      // Extract data from cached format and transform to expected format
      const transformedData: MarketOverviewData = {
        indices: {
          sp500: cachedResult.sp500Data ? {
            value: cachedResult.sp500Data.data_value.price || 0,
            change: cachedResult.sp500Data.data_value.change || 0,
            changePercent: cachedResult.sp500Data.data_value.change_percent || 0
          } : { value: 0, change: 0, changePercent: 0 },
          nasdaq: { value: 0, change: 0, changePercent: 0 }, // Not in cache yet
          dow: { value: 0, change: 0, changePercent: 0 }     // Not in cache yet
        },
        sectors: [], // Transform sector data if available
        economicIndicators: {
          // Transform economic indicators from cache
          interestRate: cachedResult.economicIndicators?.find(e => e.indicator_type === 'treasury_10y') ? {
            value: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.value || 0,
            previousValue: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.previous_value || 0,
            change: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.change || 0,
            percentChange: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.change_percent || 0,
            date: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.date || new Date().toISOString().split('T')[0],
            trend: cachedResult.economicIndicators.find(e => e.indicator_type === 'treasury_10y')?.data_value.trend || 'stable',
            source: 'cached_data'
          } : undefined,
          unemployment: cachedResult.economicIndicators?.find(e => e.indicator_type === 'unemployment') ? {
            value: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.value || 0,
            previousValue: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.previous_value || 0,
            change: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.change || 0,
            percentChange: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.change_percent || 0,
            date: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.date || new Date().toISOString().split('T')[0],
            trend: cachedResult.economicIndicators.find(e => e.indicator_type === 'unemployment')?.data_value.trend || 'stable',
            source: 'cached_data'
          } : undefined,
          cpi: cachedResult.economicIndicators?.find(e => e.indicator_type === 'cpi') ? {
            value: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.value || 0,
            previousValue: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.previous_value || 0,
            change: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.change || 0,
            percentChange: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.change_percent || 0,
            date: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.date || new Date().toISOString().split('T')[0],
            trend: cachedResult.economicIndicators.find(e => e.indicator_type === 'cpi')?.data_value.trend || 'stable',
            source: 'cached_data'
          } : undefined
        },
        fearGreedIndex: cachedResult.fearGreedIndex ? {
          value: cachedResult.fearGreedIndex.data_value.value || 50,
          status: cachedResult.fearGreedIndex.data_value.classification || 'neutral',
          confidence: 90
        } : undefined,
        vix: cachedResult.vixData ? {
          value: cachedResult.vixData.data_value.value || 20,
          status: cachedResult.vixData.data_value.status || 'moderate',
          interpretation: cachedResult.vixData.data_value.interpretation || 'Normal market conditions'
        } : undefined,
        marketSentiment: 'neutral', // Calculate based on available data
        volatilityIndex: cachedResult.vixData?.data_value.value || 20,
        source: cachedResult.source || 'cached_data',
        lastUpdated: cachedResult.lastUpdated || new Date().toISOString(),
        // Add cache metadata
        cacheInfo: {
          isFromCache: true,
          cacheHitRate: cachedResult.cacheInfo?.cacheHitRate || 0,
          totalIndicators: cachedResult.cacheInfo?.totalIndicators || 0,
          freshIndicators: cachedResult.cacheInfo?.freshIndicators || 0,
          dataAge: cachedResult.fearGreedIndex?.age_seconds || 0
        }
      };

      return transformedData;
    }

    // Fallback to direct API call if cache fails
    console.warn('⚠️ Cache miss, falling back to direct API call...');
    const result: ApiResponse<MarketOverviewData> = await edgeFunctionFetcher('market-overview');
    return {
      ...result.data,
      cacheInfo: {
        isFromCache: false,
        cacheHitRate: 0,
        totalIndicators: 0,
        freshIndicators: 0,
        dataAge: 0
      }
    };
  } catch (error) {
    console.error('MacroIndicators Fetcher Error:', error);
    throw error;
  }
};

export const useMacroIndicatorsData = () => {
  const isMarketOpen = checkMarketHours();
  
  const { data, error, isLoading, mutate } = useSWR(
    'market-overview',
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