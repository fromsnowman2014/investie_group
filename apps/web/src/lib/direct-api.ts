// Direct API integration without cache or database
// Uses direct API calls from the frontend with proper CORS handling

interface MarketOverviewData {
  indices: {
    sp500: { value: number; change: number; changePercent: number } | null;
    nasdaq: { value: number; change: number; changePercent: number } | null;
    dow: { value: number; change: number; changePercent: number } | null;
  };
  sectors: Array<{
    name: string;
    change: number;
    performance: 'positive' | 'negative';
  }>;
  economicIndicators: {
    interestRate: { value: number; date: string; trend: string; source: string } | null;
    cpi: { value: number; previousValue: number; change: number; date: string; trend: string; source: string } | null;
    unemployment: { value: number; date: string; trend: string; source: string } | null;
  };
  fearGreedIndex: { value: number; status: string; confidence: number } | null;
  vix: { value: number; status: string; interpretation: string } | null;
  marketSentiment: string;
  volatilityIndex: number;
  source: string;
  lastUpdated: string;
  timestamp: string;
  apiError?: {
    isError: boolean;
    isRateLimit: boolean;
    message: string;
    details: string;
    suggestedAction: string;
  };
  [key: string]: unknown;
}

/**
 * Fetch market data directly from Yahoo Finance API
 * Uses CORS proxy for browser compatibility
 */
interface MarketDataItem {
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  volume: number;
  marketCap: number | null;
  timestamp: string;
  source: string;
}

async function fetchYahooFinanceData(symbol: string): Promise<MarketDataItem> {
  try {
    // Multiple CORS proxy options for better reliability
    const proxies = [
      'https://corsproxy.io/?',                    // Fast and reliable
      'https://api.allorigins.win/raw?url=',       // Backup proxy
      'https://thingproxy.freeboard.io/fetch/',    // Alternative proxy
      'https://cors-anywhere.herokuapp.com/',      // Classic proxy (may have rate limits)
      ''  // Direct call as final fallback (will likely fail due to CORS)
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < proxies.length; i++) {
      const proxyUrl = proxies[i];
      try {
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const url = proxyUrl ? (proxyUrl + encodeURIComponent(targetUrl)) : targetUrl;

        const startTime = Date.now();

        // Create timeout signal for older browser compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced from 10s to 5s

        const response = await fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unable to read error response');
          console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`);
          console.error(`❌ Error body: ${errorText}`);
          throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as {
          chart?: {
            result?: Array<{
              meta?: {
                regularMarketPrice?: number;
                previousClose?: number;
                chartPreviousClose?: number;
                regularMarketVolume?: number;
                volume?: number;
                marketCap?: number;
              };
            }>;
            error?: { description: string };
          };
        };

        if (data?.chart?.error) {
          throw new Error(`Yahoo Finance API error: ${data.chart.error.description}`);
        }

        const result = data?.chart?.result?.[0];
        if (!result || !result.meta) {
          throw new Error(`No chart data available for ${symbol}`);
        }

        const meta = result.meta;
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
          source: `yahoo_finance_direct_${proxyUrl ? 'proxy' : 'direct'}`
        };

        return marketData;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Proxy ${proxyUrl || 'direct'} failed for ${symbol}:`);
        console.error(`❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
        console.error(`❌ Error message: ${lastError.message}`);
        console.error(`❌ Error stack:`, lastError.stack);

        // Log specific error types for debugging
        if (error instanceof TypeError) {
          console.error(`❌ Network error - likely CORS or connectivity issue`);
          console.error(`❌ Suggestion: This proxy may be blocked or down`);
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          console.error(`❌ Request timeout after 5 seconds`);
          console.error(`❌ Suggestion: Proxy is responding too slowly`);
        } else if (error instanceof ReferenceError) {
          console.error(`❌ AbortSignal.timeout not supported - using older browser`);
        } else {
          console.error(`❌ Unexpected error type: ${typeof error}`);
        }

        continue; // Try next proxy
      }
    }

    // If all proxies failed, throw the last error
    console.error(`❌ Direct API: All ${proxies.length} proxy methods failed for ${symbol}`);
    console.error(`❌ Final error:`, lastError);
    throw lastError || new Error('All proxy methods failed');

  } catch (error) {
    console.error(`❌ Direct API: Outer catch - Failed to fetch ${symbol}:`);
    console.error(`❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`❌ Error message:`, error instanceof Error ? error.message : String(error));
    throw error; // Don't use mock data, let the error propagate
  }
}


/**
 * Fetch CPI data from our Next.js API route (which calls FRED API server-side)
 * This avoids CORS issues by using a server-side API route
 */
async function fetchCPIData(): Promise<{
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  monthOverMonth: number;
  yearOverYear: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  direction: 'up' | 'down' | 'stable';
  inflationPressure: 'low' | 'moderate' | 'high';
  source: string;
} | null> {
  try {
    const response = await fetch('/api/v1/market/cpi', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 15 second timeout
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`CPI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as {
      success: boolean;
      data: {
        value: number;
        previousValue: number;
        change: number;
        percentChange: number;
        monthOverMonth: number;
        yearOverYear: number;
        date: string;
        trend: 'rising' | 'falling' | 'stable';
        direction: 'up' | 'down' | 'stable';
        inflationPressure: 'low' | 'moderate' | 'high';
        source: string;
      };
      message?: string;
      fallback?: boolean;
    };

    if (!result.success || !result.data) {
      throw new Error('Invalid CPI API response');
    }

    // Log if using fallback data
    if (result.fallback) {
      console.warn('⚠️ CPI API using fallback data:', result.message);
    }

    return result.data;

  } catch (error) {
    console.error('❌ CPI API: Failed to fetch CPI data:', error);
    return null;
  }
}

/**
 * @deprecated Use fetchCPIData() instead
 * Fetch economic indicators from FRED API (Federal Reserve Economic Data)
 * This function is deprecated and kept only for unemployment data until it's refactored
 */
async function fetchFredData(seriesId: string): Promise<{ value: number; date: string } | null> {
  // FRED API는 CORS를 지원하지 않으므로 클라이언트에서는 호출하지 않음
  // 서버사이드 (API routes)에서만 사용 가능
  const fredApiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;

  // 클라이언트 환경이거나 API 키가 없으면 null 반환 (fallback 데이터 사용)
  if (typeof window !== 'undefined') {
    console.warn(`⚠️ FRED API: Skipping client-side call to avoid CORS. Using fallback data.`);
    return null;
  }

  if (!fredApiKey || fredApiKey === 'demo') {
    return null;
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&limit=1&sort_order=desc`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      observations?: Array<{
        date: string;
        value: string;
      }>;
    };

    if (!data.observations || data.observations.length === 0) {
      throw new Error(`No FRED data available for ${seriesId}`);
    }

    const observation = data.observations[0];
    const value = parseFloat(observation.value);

    if (isNaN(value)) {
      throw new Error(`Invalid FRED data value for ${seriesId}: ${observation.value}`);
    }

    return {
      value,
      date: observation.date
    };

  } catch (error) {
    console.error(`❌ FRED API: Failed to fetch ${seriesId}:`, error);
    return null;
  }
}

/**
 * Fetch Fear & Greed Index from CNN (Stock market sentiment)
 * Uses CNN's production DataViz API for real stock market Fear & Greed Index
 */
async function fetchFearGreedIndex(): Promise<{ value: number; status: string; confidence: number } | null> {
  try {
    const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CNN Fear & Greed API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      fear_and_greed?: {
        score: number;
        rating: string;
        timestamp: string;
        previous_close?: number;
        previous_1_week?: number;
        previous_1_month?: number;
        previous_1_year?: number;
      };
    };

    if (!data.fear_and_greed) {
      throw new Error('No Fear & Greed data available from CNN');
    }

    const fngData = data.fear_and_greed;
    const value = Math.round(fngData.score); // Round to nearest integer (0-100)

    if (isNaN(value) || value < 0 || value > 100) {
      throw new Error(`Invalid Fear & Greed value: ${fngData.score}`);
    }

    // Use CNN's rating directly (fear, extreme fear, neutral, greed, extreme greed)
    const status = fngData.rating.toLowerCase();
    const confidence = 1.0; // High confidence - official CNN stock market data

    console.log(`✅ CNN Fear & Greed: ${value} (${status}) at ${fngData.timestamp}`);

    return {
      value,
      status,
      confidence
    };

  } catch (error) {
    console.error('❌ CNN Fear & Greed API: Failed to fetch:', error);
    return null;
  }
}

/**
 * Fetch comprehensive market overview data using direct APIs
 */
export async function fetchMarketOverviewDirect(): Promise<MarketOverviewData> {
  try {
    // Fetch market data and economic indicators in parallel with individual error handling
    const fetchStartTime = Date.now();

    const results = await Promise.allSettled([
      fetchYahooFinanceData('^GSPC'), // S&P 500 Index (actual index, not ETF)
      fetchYahooFinanceData('^VIX'),  // VIX Volatility Index
      fetchYahooFinanceData('^IXIC'), // NASDAQ Composite Index (actual index, not ETF)
      fetchYahooFinanceData('^DJI'),  // DOW Jones Industrial Average (actual index, not ETF)
      fetchYahooFinanceData('^TNX'),  // 10 Year Treasury Note
      fetchCPIData(),                 // Consumer Price Index (via API route)
      fetchFredData('UNRATE'),        // Unemployment Rate
      fetchFearGreedIndex()           // Fear & Greed Index (Crypto-based proxy)
    ]);

    // Extract data with fallbacks and log failures
    const sp500Data = results[0].status === 'fulfilled' ? results[0].value : (console.warn('⚠️ S&P 500 fetch failed:', results[0].reason), null);
    const vixData = results[1].status === 'fulfilled' ? results[1].value : (console.warn('⚠️ VIX fetch failed:', results[1].reason), null);
    const nasdaqData = results[2].status === 'fulfilled' ? results[2].value : (console.warn('⚠️ NASDAQ fetch failed:', results[2].reason), null);
    const dowData = results[3].status === 'fulfilled' ? results[3].value : (console.warn('⚠️ DOW fetch failed:', results[3].reason), null);
    const treasuryData = results[4].status === 'fulfilled' ? results[4].value : (console.warn('⚠️ 10Y Treasury fetch failed:', results[4].reason), null);
    const cpiData = results[5].status === 'fulfilled' ? results[5].value : (console.warn('⚠️ CPI fetch failed:', results[5].reason), null);
    const unemploymentData = results[6].status === 'fulfilled' ? results[6].value : (console.warn('⚠️ Unemployment fetch failed:', results[6].reason), null);
    const fearGreedData = results[7].status === 'fulfilled' ? results[7].value : (console.warn('⚠️ Fear & Greed fetch failed:', results[7].reason), null);

    console.log('✅ Market data fetch summary:', {
      sp500: !!sp500Data,
      vix: !!vixData,
      nasdaq: !!nasdaqData,
      dow: !!dowData,
      treasury: !!treasuryData,
      cpi: !!cpiData,
      unemployment: !!unemploymentData,
      fearGreed: !!fearGreedData
    });

    // Build market overview response
    const marketOverview: MarketOverviewData = {
      indices: {
        sp500: sp500Data ? {
          value: sp500Data.price,
          change: sp500Data.change,
          changePercent: sp500Data.changePercent
        } : null,
        nasdaq: nasdaqData ? {
          value: nasdaqData.price,
          change: nasdaqData.change,
          changePercent: nasdaqData.changePercent
        } : null,
        dow: dowData ? {
          value: dowData.price,
          change: dowData.change,
          changePercent: dowData.changePercent
        } : null
      },
      sectors: [], // No mock sectors data
      economicIndicators: {
        interestRate: treasuryData ? {
          value: treasuryData.price,
          date: treasuryData.timestamp,
          trend: treasuryData.change > 0 ? 'rising' : treasuryData.change < 0 ? 'falling' : 'stable',
          source: 'yahoo_finance_^TNX'
        } : null,
        cpi: cpiData || {
          // Fallback data when CPI API is not available
          value: 2.40,
          previousValue: 2.50,
          change: -0.10,
          date: new Date().toISOString(),
          trend: 'falling',
          source: 'fallback_data'
        },
        unemployment: unemploymentData ? {
          value: unemploymentData.value,
          date: unemploymentData.date,
          trend: 'stable', // Would need historical data to determine trend
          source: 'fred_api_UNRATE'
        } : {
          // Fallback data when FRED API is not available
          value: 4.0,
          date: new Date().toISOString(),
          trend: 'stable',
          source: 'fallback_data'
        }
      },
      fearGreedIndex: fearGreedData,
      vix: vixData ? {
        value: vixData.price,
        status: vixData.price < 20 ? 'low' : vixData.price > 30 ? 'high' : 'moderate',
        interpretation: vixData.price < 20
          ? 'Low volatility - stable market conditions'
          : vixData.price > 30
          ? 'High volatility - increased market uncertainty'
          : 'Moderate volatility - normal market fluctuations'
      } : null,
      marketSentiment: sp500Data
        ? (sp500Data.changePercent > 0.5 ? 'bullish' : sp500Data.changePercent < -0.5 ? 'bearish' : 'neutral')
        : 'unavailable',
      volatilityIndex: vixData ? vixData.price : 0,
      source: 'direct_api_yahoo_finance',
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    return marketOverview;

  } catch (error) {
    console.error('❌ Direct API: Market overview fetch failed:', error);

    // Return error information instead of fallback data
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.toLowerCase().includes('too many requests') ||
                       errorMessage.toLowerCase().includes('rate limit') ||
                       errorMessage.toLowerCase().includes('429');

    return {
      indices: { sp500: null, nasdaq: null, dow: null },
      sectors: [],
      economicIndicators: {
        interestRate: null,
        cpi: null,
        unemployment: null
      },
      fearGreedIndex: null,
      vix: null,
      marketSentiment: 'unavailable',
      volatilityIndex: 0,
      source: 'api_error',
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      apiError: {
        isError: true,
        isRateLimit,
        message: isRateLimit
          ? 'API rate limit exceeded. Please wait and try again later.'
          : 'Unable to fetch market data. Please check your internet connection.',
        details: errorMessage,
        suggestedAction: isRateLimit
          ? 'Wait for rate limit to reset and try again'
          : 'Check your internet connection and try again'
      }
    } as MarketOverviewData;
  }
}

