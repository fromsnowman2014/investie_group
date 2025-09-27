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
 * Fetch live market data using Yahoo Finance API (no API key required)
 */
async function fetchLiveMarketData(): Promise<DatabaseReaderResponse> {
  const log = logFunctionCall('fetchLiveMarketData', {});

  try {
    console.log('📡 Fetching live market data using Yahoo Finance...');

    // Fetch S&P 500 data (SPY ETF) and VIX data
    const [sp500Data, vixData, nasdaqData] = await Promise.all([
      fetchYahooFinanceData('SPY'),
      fetchYahooFinanceData('^VIX'),
      fetchYahooFinanceData('QQQ')
    ]);

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
        data_source: 'yahoo_finance_live',
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
        data_source: 'yahoo_finance_live',
        created_at: new Date().toISOString()
      });
    }

    if (nasdaqData) {
      marketIndicators.push({
        indicator_type: 'nasdaq',
        data_value: {
          price: nasdaqData.price,
          change: nasdaqData.change,
          change_percent: nasdaqData.changePercent,
          previous_close: nasdaqData.previousClose
        },
        data_source: 'yahoo_finance_live',
        created_at: new Date().toISOString()
      });
    }

    const response: DatabaseReaderResponse = {
      economicIndicators: [], // Economic indicators require different APIs
      marketIndicators,
      sp500Data: marketIndicators.find(i => i.indicator_type === 'sp500'),
      nasdaqData: marketIndicators.find(i => i.indicator_type === 'nasdaq'),
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

    console.log(`✅ Fetched ${marketIndicators.length} live market indicators from Yahoo Finance`);
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
 * Fetch data from Yahoo Finance API (no API key required)
 */
async function fetchYahooFinanceData(symbol: string) {
  try {
    console.log(`📈 Fetching ${symbol} data from Yahoo Finance...`);

    // Use Yahoo Finance query API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.meta) {
      console.warn(`⚠️ No quote data for ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      previousClose: previousClose,
      volume: meta.regularMarketVolume || 0
    };

  } catch (error) {
    console.error(`❌ Failed to fetch ${symbol} from Yahoo Finance:`, error);
    return null;
  }
}

/**
 * Generate mock database response as fallback
 */
function generateMockDatabaseResponse(): DatabaseReaderResponse {
  console.log('🎭 Generating mock market data as fallback...');

  const now = new Date().toISOString();

  // Generate realistic mock data based on current market trends
  const mockSP500 = {
    indicator_type: 'sp500',
    data_value: {
      price: 4485.2,
      change: 15.7,
      change_percent: 0.35,
      previous_close: 4469.5
    },
    data_source: 'yahoo_finance_mock',
    created_at: now
  };

  const mockNASDAQ = {
    indicator_type: 'nasdaq',
    data_value: {
      price: 395.8,
      change: 2.1,
      change_percent: 0.53,
      previous_close: 393.7
    },
    data_source: 'yahoo_finance_mock',
    created_at: now
  };

  const mockVIX = {
    indicator_type: 'vix',
    data_value: {
      price: 16.8,
      change: -1.2,
      change_percent: -6.7
    },
    data_source: 'yahoo_finance_mock',
    created_at: now
  };

  return {
    economicIndicators: [],
    marketIndicators: [mockSP500, mockNASDAQ, mockVIX],
    sp500Data: mockSP500,
    nasdaqData: mockNASDAQ,
    vixData: mockVIX,
    lastUpdated: now,
    source: 'mock_fallback' as const,
    cacheInfo: {
      totalIndicators: 3,
      freshIndicators: 3,
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
    console.log('📊 Market overview request received - using Yahoo Finance live API data');

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