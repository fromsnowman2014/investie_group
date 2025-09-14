import useSWR from 'swr';
import { MarketOverviewData, ApiResponse } from '@/types/api';
import { edgeFunctionFetcher, logEnvironmentStatus } from '@/lib/api-utils';

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
  console.log('📊 MacroIndicators Fetcher Starting: market-overview');
  
  // Log environment status for debugging
  logEnvironmentStatus();
  
  try {
    const result: ApiResponse<MarketOverviewData> = await edgeFunctionFetcher('market-overview');
    
    console.group('📊 MacroIndicators Data Analysis');
    console.log('✅ Response received successfully');
    console.log('📦 Has Data:', !!result.data);
    console.log('🏷️ Data Source:', result.data?.source);
    console.log('📈 Indices Count:', Object.keys(result.data?.indices || {}).length);
    console.log('🏭 Sectors Count:', result.data?.sectors?.length || 0);
    console.log('💰 S&P 500 Value:', result.data?.indices?.sp500?.value);
    console.log('⏰ API Timestamp:', result.timestamp);
    
    if (result.data?.source === 'mock_data') {
      console.warn('⚠️ Still receiving mock data from backend');
      console.warn('🔧 Check Supabase Edge Functions Alpha Vantage API key configuration');
    } else if (result.data?.source === 'alpha_vantage') {
      console.log('✅ Real Alpha Vantage data confirmed!');
    }
    
    console.groupEnd();
    return result.data;
  } catch (error) {
    console.error('❌ MacroIndicators Fetcher Error:', error);
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