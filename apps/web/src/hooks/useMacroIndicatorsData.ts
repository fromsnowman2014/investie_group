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
    // Temporarily use market-overview directly due to database-reader issues
    console.log('🔍 Fetching market data directly from market-overview...');

    const result = await edgeFunctionFetcher('market-overview', {});

    // market-overview returns data directly in the correct format
    if (result) {
      console.log('✅ Got market data directly from market-overview');
      
      // Return the data directly as market-overview already provides the correct format
      return result as MarketOverviewData;
    }

    throw new Error('No data received from market-overview');
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