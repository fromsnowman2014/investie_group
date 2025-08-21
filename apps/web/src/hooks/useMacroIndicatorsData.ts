import useSWR from 'swr';
import { MarketOverviewData, ApiResponse } from '@/types/api';

// Check if market is open (simplified - US Eastern time)
const checkMarketHours = (): boolean => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const hour = easternTime.getHours();
  const day = easternTime.getDay();
  
  // Market open Mon-Fri 9:30 AM to 4:00 PM EST (simplified to 9-16)
  return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
};

const fetcher = async (url: string): Promise<MarketOverviewData> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  // Enhanced debugging for deployed environment
  console.log('🔍 MacroIndicators API Debug:', {
    originalUrl: url,
    baseUrl: baseUrl,
    fullUrl: fullUrl,
    envApiUrl: process.env.NEXT_PUBLIC_API_URL,
    timestamp: new Date().toISOString(),
    isProduction: process.env.NODE_ENV === 'production'
  });
  
  try {
    const response = await fetch(fullUrl);
    
    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const result: ApiResponse<MarketOverviewData> = await response.json();
    
    console.log('📊 Market Data Response:', {
      hasData: !!result.data,
      dataSource: result.data?.source,
      indicesCount: Object.keys(result.data?.indices || {}).length,
      sectorsCount: result.data?.sectors?.length || 0,
      timestamp: result.timestamp
    });
    
    return result.data;
  } catch (error) {
    console.error('❌ MacroIndicators API Error:', {
      error: error instanceof Error ? error.message : error,
      fullUrl: fullUrl,
      baseUrl: baseUrl
    });
    throw error;
  }
};

export const useMacroIndicatorsData = () => {
  const isMarketOpen = checkMarketHours();
  
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/market/overview',
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