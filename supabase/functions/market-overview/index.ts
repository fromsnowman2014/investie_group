// Market Overview API - Refactored version
// Provides market data through a 12-hour cache system with on-demand updates

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import type {
  MarketOverviewResponse,
  APIDataRequest
} from '../_shared/types.ts'
import {
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  safeParseJSON,
  logFunctionCall
} from '../_shared/utils.ts'
import {
  convertRealTimeDataToMarketOverview,
  type RealTimeMarketData
} from '../_shared/data-transformers.ts'

// Direct API configuration - no database dependencies

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
async function fetchLiveMarketData(): Promise<RealTimeMarketData> {
  const log = logFunctionCall('fetchLiveMarketData', {});

  try {
    console.log('📡 Fetching live market data using Yahoo Finance...');
    console.log('🔍 About to fetch data for symbols: SPY, ^VIX, QQQ, DIA');

    // Fetch comprehensive market data: S&P 500, NASDAQ, DOW, VIX
    const [sp500Data, vixData, nasdaqData, dowData] = await Promise.all([
      fetchYahooFinanceData('SPY'),   // S&P 500 ETF
      fetchYahooFinanceData('^VIX'),  // VIX Volatility Index
      fetchYahooFinanceData('QQQ'),   // NASDAQ-100 ETF
      fetchYahooFinanceData('DIA')    // DOW Jones ETF
    ]);

    console.log('📊 Yahoo Finance API responses:', {
      sp500: sp500Data ? '✅ Success' : '❌ Failed',
      vix: vixData ? '✅ Success' : '❌ Failed',
      nasdaq: nasdaqData ? '✅ Success' : '❌ Failed',
      dow: dowData ? '✅ Success' : '❌ Failed'
    });

    // Create real-time market data structure
    const realTimeData: RealTimeMarketData = {
      sp500: sp500Data ? {
        price: sp500Data.price,
        change: sp500Data.change,
        changePercent: sp500Data.changePercent,
        previousClose: sp500Data.previousClose
      } : undefined,
      nasdaq: nasdaqData ? {
        price: nasdaqData.price,
        change: nasdaqData.change,
        changePercent: nasdaqData.changePercent,
        previousClose: nasdaqData.previousClose
      } : undefined,
      dow: dowData ? {
        price: dowData.price,
        change: dowData.change,
        changePercent: dowData.changePercent,
        previousClose: dowData.previousClose
      } : undefined,
      vix: vixData ? {
        price: vixData.price,
        change: vixData.change,
        changePercent: vixData.changePercent
      } : undefined,
      lastUpdated: new Date().toISOString(),
      source: 'yahoo_finance_live'
    };

    console.log(`✅ Fetched live market data from Yahoo Finance:`, {
      sp500: !!realTimeData.sp500,
      nasdaq: !!realTimeData.nasdaq,
      dow: !!realTimeData.dow,
      vix: !!realTimeData.vix
    });
    log.end(realTimeData);
    return realTimeData;

  } catch (error) {
    console.error('❌ Live market data fetch failed:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: error instanceof Error ? error.cause : undefined
    });
    log.error(error instanceof Error ? error : new Error(String(error)));

    // No fallback - throw the error to identify root cause
    throw error;
  }
}

/**
 * Fetch data from Yahoo Finance API with improved error handling and retry logic
 */
async function fetchYahooFinanceData(symbol: string, retries = 2): Promise<any> {
  const maxRetries = retries;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📈 Fetching ${symbol} data from Yahoo Finance... (attempt ${attempt + 1}/${maxRetries + 1})`);

      // Use primary Yahoo Finance chart API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      console.log(`🔗 Request URL: ${url}`);

      const fetchOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      };

      console.log(`📋 Request headers:`, fetchOptions.headers);

      const startTime = Date.now();
      const response = await fetch(url, fetchOptions);
      const responseTime = Date.now() - startTime;

      console.log(`⏱️ Response time: ${responseTime}ms`);
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Yahoo Finance response for ${symbol}:`, {
        hasChart: !!data?.chart,
        hasResult: !!data?.chart?.result?.[0],
        hasMeta: !!data?.chart?.result?.[0]?.meta,
        error: data?.chart?.error
      });

      if (data?.chart?.error) {
        throw new Error(`Yahoo Finance API error: ${data.chart.error.description}`);
      }

      const result = data?.chart?.result?.[0];
      if (!result || !result.meta) {
        throw new Error(`No chart data available for ${symbol}`);
      }

      const meta = result.meta;

      // Extract market data with comprehensive fallbacks
      const currentPrice = meta.regularMarketPrice || meta.previousClose || meta.chartPreviousClose;
      const previousClose = meta.previousClose || meta.chartPreviousClose;

      if (!currentPrice || !previousClose) {
        throw new Error(`Missing price data for ${symbol}: current=${currentPrice}, previous=${previousClose}`);
      }

      const change = Number((currentPrice - previousClose).toFixed(4));
      const changePercent = Number(((change / previousClose) * 100).toFixed(4));

      const marketData = {
        price: Number(currentPrice.toFixed(2)),
        change: change,
        changePercent: changePercent,
        previousClose: Number(previousClose.toFixed(2)),
        volume: meta.regularMarketVolume || meta.volume || 0,
        marketCap: meta.marketCap || null,
        timestamp: new Date().toISOString(),
        source: 'yahoo_finance_live'
      };

      console.log(`✅ Successfully fetched ${symbol} data:`, marketData);
      return marketData;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ Attempt ${attempt + 1} failed for ${symbol}:`, lastError.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ All ${maxRetries + 1} attempts failed for ${symbol}:`, lastError?.message);
  return null;
}

// Note: generateMockDatabaseResponse function removed - no more mock data fallbacks

/**
 * Main request handler
 */
Deno.serve(async (req: Request) => {
  const log = logFunctionCall('market-overview', { method: req.method });

  console.log('🚀 Market overview function started');
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);

  // Handle CORS and method validation
  const methodValidation = validateMethod(req, ['POST']);
  if (methodValidation) {
    console.log('📋 CORS/Method validation response sent');
    return methodValidation;
  }

  try {
    console.log('📊 Market overview request received - using Yahoo Finance live API data');

    // Parse request body with safe defaults
    const requestBody = await safeParseJSON(req, {});
    console.log('📝 Request body parsed:', requestBody);

    // Get live market data from APIs
    console.log('🌐 Starting live market data fetch...');
    const realTimeData = await fetchLiveMarketData();
    console.log('📈 Live data fetch completed:', {
      source: realTimeData.source,
      hasS500: !!realTimeData.sp500,
      hasNasdaq: !!realTimeData.nasdaq,
      hasDow: !!realTimeData.dow,
      hasVix: !!realTimeData.vix
    });

    // Convert real-time data to market overview format
    console.log('🔄 Converting real-time data to market overview format...');
    const marketOverview = convertRealTimeDataToMarketOverview(realTimeData);
    console.log('✅ Market overview conversion completed:', {
      hasIndices: !!marketOverview.indices,
      sp500Value: marketOverview.indices?.sp500?.value,
      source: marketOverview.source
    });

    console.log(`✅ Market overview delivered from ${realTimeData.source}`);

    log.end(marketOverview);
    return createSuccessResponse(marketOverview, CACHE_HEADERS);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Market overview function error:', errorMessage);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', error);
    console.error('❌ Environment info:', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date().toISOString()
    });

    // Network connectivity test
    try {
      console.log('🔍 Testing basic network connectivity...');
      const testResponse = await fetch('https://httpbin.org/get', {
        headers: { 'User-Agent': 'Supabase-Edge-Function-Test' }
      });
      console.log('✅ Basic network test successful:', testResponse.status);
    } catch (networkError) {
      console.error('❌ Basic network test failed:', networkError);
    }

    // Yahoo Finance specific test
    try {
      console.log('🔍 Testing Yahoo Finance specific connectivity...');
      const yahooTest = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log('✅ Yahoo Finance connectivity test:', yahooTest.status);
      if (yahooTest.ok) {
        const testData = await yahooTest.text();
        console.log('📊 Yahoo Finance response sample:', testData.substring(0, 200));
      }
    } catch (yahooError) {
      console.error('❌ Yahoo Finance connectivity test failed:', yahooError);
    }

    log.error(error instanceof Error ? error : new Error(String(error)));

    return createErrorResponse(
      'Market data fetch failed',
      500,
      `Yahoo Finance API error: ${errorMessage}`
    );
  }
});