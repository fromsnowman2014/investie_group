// Market Overview API - Refactored version
// Provides market data through a 12-hour cache system with on-demand updates

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type {
  MarketOverviewResponse,
  CachedDataQuery,
  DatabaseReaderResponse,
  CachedMarketData
} from '../_shared/types.ts'
import {
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  safeParseJSON,
  callInternalFunction,
  logFunctionCall
} from '../_shared/utils.ts'
import {
  convertCachedDataToMarketOverview,
  generateMockMarketOverview
} from '../_shared/data-transformers.ts'

// Direct database access setup (bypassing database-reader)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-application-name': 'market-overview-direct' } }
})

/**
 * Configuration constants
 */
const DEFAULT_MAX_AGE = 43200; // 12 hours in seconds
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300' // Cache for 5 minutes on client side
};

/**
 * Fetch live market data using API keys
 */
async function fetchLiveMarketData(): Promise<DatabaseReaderResponse> {
  const log = logFunctionCall('fetchLiveMarketData', {});

  try {
    console.log('📡 Fetching live market data using API keys...');

    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    if (!ALPHA_VANTAGE_API_KEY) {
      console.warn('⚠️ No Alpha Vantage API key found, generating mock data');
      return generateMockDatabaseResponse();
    }

    // Fetch S&P 500 data (SPY ETF)
    const sp500Data = await fetchAlphaVantageData('SPY', ALPHA_VANTAGE_API_KEY);

    // Fetch VIX data
    const vixData = await fetchAlphaVantageData('VIX', ALPHA_VANTAGE_API_KEY);

    // Create market indicators from fetched data
    const marketIndicators: CachedMarketData[] = [];

    if (sp500Data) {
      marketIndicators.push({
        indicator_type: 'sp500',
        data_value: {
          price: sp500Data.price,
          change: sp500Data.change,
          change_percent: sp500Data.changePercent,
          previous_close: sp500Data.previousClose
        },
        data_source: 'alpha_vantage_live',
        created_at: new Date().toISOString()
      });
    }

    if (vixData) {
      marketIndicators.push({
        indicator_type: 'vix',
        data_value: {
          price: vixData.price,
          change: vixData.change,
          change_percent: vixData.changePercent
        },
        data_source: 'alpha_vantage_live',
        created_at: new Date().toISOString()
      });
    }

    const response: DatabaseReaderResponse = {
      economicIndicators: [], // Economic indicators require different APIs
      marketIndicators,
      sp500Data: marketIndicators.find(i => i.indicator_type === 'sp500'),
      vixData: marketIndicators.find(i => i.indicator_type === 'vix'),
      lastUpdated: new Date().toISOString(),
      source: 'realtime' as const,
      cacheInfo: {
        totalIndicators: marketIndicators.length,
        freshIndicators: marketIndicators.length,
        staleIndicators: 0,
        cacheHitRate: 0
      }
    };

    console.log(`✅ Fetched ${marketIndicators.length} live market indicators`);
    log.end(response);
    return response;

  } catch (error) {
    console.error('❌ Live market data fetch failed:', error);
    log.error(error instanceof Error ? error : new Error(String(error)));

    // Return mock data as fallback
    return generateMockDatabaseResponse();
  }
}

/**
 * Fetch data from Alpha Vantage API
 */
async function fetchAlphaVantageData(symbol: string, apiKey: string) {
  try {
    console.log(`📈 Fetching ${symbol} data from Alpha Vantage...`);

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      console.warn(`⚠️ No quote data for ${symbol}`);
      return null;
    }

    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      previousClose: parseFloat(quote['08. previous close']),
      volume: parseInt(quote['06. volume'])
    };

  } catch (error) {
    console.error(`❌ Failed to fetch ${symbol} from Alpha Vantage:`, error);
    return null;
  }
}

/**
 * Generate mock database response as fallback
 */
function generateMockDatabaseResponse(): DatabaseReaderResponse {
  console.log('🎭 Generating mock market data...');

  const now = new Date().toISOString();
  const mockSP500 = {
    indicator_type: 'sp500',
    data_value: {
      price: 4450.5,
      change: 12.3,
      change_percent: 0.28,
      previous_close: 4438.2
    },
    data_source: 'mock_fallback',
    created_at: now
  };

  const mockVIX = {
    indicator_type: 'vix',
    data_value: {
      price: 18.5,
      change: -0.8,
      change_percent: -4.1
    },
    data_source: 'mock_fallback',
    created_at: now
  };

  return {
    economicIndicators: [],
    marketIndicators: [mockSP500, mockVIX],
    sp500Data: mockSP500,
    vixData: mockVIX,
    lastUpdated: now,
    source: 'mock_fallback' as const,
    cacheInfo: {
      totalIndicators: 2,
      freshIndicators: 2,
      staleIndicators: 0,
      cacheHitRate: 0
    }
  };
}

/**
 * Main request handler
 */
Deno.serve(async (req: Request) => {
  const log = logFunctionCall('market-overview', { method: req.method });

  // Handle CORS and method validation
  const methodValidation = validateMethod(req, ['POST']);
  if (methodValidation) {
    return methodValidation;
  }

  try {
    console.log('📊 Market overview request received - using live API data');

    // Parse request body with safe defaults
    const requestBody = await safeParseJSON(req, {});

    // Get live market data using API keys
    const liveData = await fetchLiveMarketData();

    // Convert live data to the expected market overview format
    const marketOverview = convertCachedDataToMarketOverview(liveData);

    console.log(`✅ Market overview delivered from cache (${marketOverview.cacheInfo?.cacheHitRate || 0}% hit rate)`);

    log.end(marketOverview);
    return createSuccessResponse(marketOverview, CACHE_HEADERS);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Market overview function error:', errorMessage);

    log.error(error instanceof Error ? error : new Error(String(error)));

    // Return fallback mock data on error
    try {
      const mockOverview = generateMockMarketOverview();

      return createSuccessResponse({
        ...mockOverview,
        source: 'fallback_due_to_error',
        error: errorMessage
      });

    } catch (fallbackError) {
      console.error('❌ Failed to generate fallback data:', fallbackError);

      return createErrorResponse(
        'Internal server error',
        500,
        'Failed to retrieve market data and generate fallback'
      );
    }
  }
});