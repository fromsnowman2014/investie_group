// Smart Market Data Fetcher - Routes between Direct API and Edge Functions
// Uses feature flag to determine data source

import { fetchMarketOverview } from './api-utils';

/**
 * Economic Indicator interface
 */
interface EconomicIndicator {
  value: number;
  previousValue?: number;
  change?: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  source: string;
}

/**
 * Individual Indicator Response interface
 */
interface IndicatorResponse {
  indicator_type: string;
  data_value: {
    value?: number;
    change?: number;
    changePercent?: number;
    price?: number;
    status?: string;
    confidence?: number;
    interpretation?: string;
  };
  data_source: string;
  created_at: string;
}

/**
 * Market Overview Response interface (simplified for real-time API)
 */
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
  economicIndicators?: Record<string, EconomicIndicator>;
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

/**
 * Smart market overview fetcher
 * Uses feature flag to route between Direct API and Edge Functions
 */
export async function hybridMarketOverviewFetcher(): Promise<MarketOverviewResponse> {
  try {
    console.log('🎯 Smart Market Fetcher: Starting intelligent data fetch...');

    // Debug environment variables
    console.log('🔧 Smart Market Fetcher: Environment check:', {
      useDirectAPI: process.env.NEXT_PUBLIC_USE_DIRECT_API,
      nodeEnv: process.env.NODE_ENV,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
      timestamp: new Date().toISOString()
    });

    const result = await fetchMarketOverview();

    console.log('✅ Smart Market Fetcher: Data fetch completed successfully', {
      source: result.source,
      sp500Value: result.indices?.sp500?.value,
      timestamp: result.timestamp
    });

    return result as unknown as MarketOverviewResponse;

  } catch (error) {
    console.error('❌ Smart Market Fetcher: Fetch failed:', error);
    console.error('🚨 Smart Market Fetcher: Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    throw new Error(`Smart market overview fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Individual indicator fetcher (deprecated - use market overview instead)
 */
export async function hybridIndicatorFetcher(indicatorType: string): Promise<IndicatorResponse | null> {
  console.warn(`⚠️ hybridIndicatorFetcher is deprecated. Use hybridMarketOverviewFetcher instead. Requested: ${indicatorType}`);

  try {
    const marketOverview = await hybridMarketOverviewFetcher();

    // Extract specific indicator from market overview
    switch (indicatorType) {
      case 'sp500':
        return {
          indicator_type: 'sp500',
          data_value: marketOverview.indices.sp500,
          data_source: marketOverview.source,
          created_at: marketOverview.lastUpdated
        };
      case 'vix':
        return {
          indicator_type: 'vix',
          data_value: marketOverview.vix || { value: 20, status: 'moderate', interpretation: 'VIX data unavailable' },
          data_source: marketOverview.source,
          created_at: marketOverview.lastUpdated
        };
      case 'nasdaq':
        return {
          indicator_type: 'nasdaq',
          data_value: marketOverview.indices.nasdaq,
          data_source: marketOverview.source,
          created_at: marketOverview.lastUpdated
        };
      case 'fear_greed':
        return {
          indicator_type: 'fear_greed',
          data_value: marketOverview.fearGreedIndex || { value: 50, status: 'neutral', confidence: 50 },
          data_source: marketOverview.source,
          created_at: marketOverview.lastUpdated
        };
      default:
        console.warn(`Unknown indicator type: ${indicatorType}`);
        return null;
    }
  } catch (error) {
    console.error(`❌ Failed to fetch ${indicatorType} from market overview:`, error);
    return null;
  }
}

/**
 * Get current API mode based on feature flag
 */
export function getCurrentAPIMode(): 'direct_api' | 'edge_functions' {
  return process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true' ? 'direct_api' : 'edge_functions';
}

/**
 * API status information
 */
export function getAPIStatus() {
  const mode = getCurrentAPIMode();
  const useDirectAPI = process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true';

  return {
    mode,
    description: useDirectAPI
      ? 'Using Direct API calls to Yahoo Finance (no cache, no database)'
      : 'Using Supabase Edge Functions with Yahoo Finance API',
    realTimeEnabled: true,
    cacheEnabled: false,
    databaseEnabled: false,
    featureFlag: process.env.NEXT_PUBLIC_USE_DIRECT_API,
    timestamp: new Date().toISOString()
  };
}