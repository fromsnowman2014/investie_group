// Real-time Market Data Fetcher - Direct API only
// Simplified fetcher that calls market-overview Edge Function directly

import { edgeFunctionFetcher } from './api-utils';

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
 * Real-time market overview fetcher
 * Calls market-overview Edge Function which uses Yahoo Finance API directly
 */
export async function hybridMarketOverviewFetcher(): Promise<MarketOverviewResponse> {
  try {
    console.log('📡 Fetching real-time market data via market-overview Edge Function...');

    const result = await edgeFunctionFetcher('market-overview', {});

    console.log('✅ Real-time market data fetch completed successfully');

    return result as MarketOverviewResponse;

  } catch (error) {
    console.error('❌ Market overview fetch failed:', error);
    throw new Error(`Market overview API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Get current API mode (always returns 'real_time_api' now)
 */
export function getCurrentAPIMode(): 'real_time_api' {
  return 'real_time_api';
}

/**
 * API status information
 */
export function getAPIStatus() {
  return {
    mode: 'real_time_api',
    description: 'Using Yahoo Finance API via market-overview Edge Function',
    realTimeEnabled: true,
    cacheEnabled: false,
    timestamp: new Date().toISOString()
  };
}