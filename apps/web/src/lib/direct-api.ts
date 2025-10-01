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
  console.log(`📈 Direct API: Fetching ${symbol} data from Yahoo Finance...`);

  try {
    // Multiple CORS proxy options for better reliability
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.allorigins.win/raw?url=',  // Try the working proxy twice for better reliability
      ''  // Direct call as fallback (will likely fail due to CORS)
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < proxies.length; i++) {
      const proxyUrl = proxies[i];
      try {
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const url = proxyUrl ? (proxyUrl + encodeURIComponent(targetUrl)) : targetUrl;

        console.log(`🔗 [${i + 1}/${proxies.length}] Trying proxy: ${proxyUrl || 'direct'}`);
        console.log(`🔗 Full URL: ${url}`);

        const startTime = Date.now();

        // Create timeout signal for older browser compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const endTime = Date.now();
        console.log(`⏱️ Request took ${endTime - startTime}ms`);
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

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
        console.log(`📊 Direct API response for ${symbol}:`, {
          hasChart: !!data?.chart,
          hasResult: !!data?.chart?.result?.[0],
          hasMeta: !!data?.chart?.result?.[0]?.meta,
          error: data?.chart?.error,
          proxyUsed: proxyUrl || 'direct'
        });

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

        console.log(`✅ Direct API: Successfully fetched ${symbol} data via ${proxyUrl || 'direct'}:`, marketData);
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
          console.error(`❌ Request timeout after 10 seconds`);
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
 * Fetch comprehensive market overview data using direct APIs
 */
export async function fetchMarketOverviewDirect(): Promise<MarketOverviewData> {
  console.log('🌐 Direct API: Starting comprehensive market data fetch...');
  console.log('🌐 Environment check:', {
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  try {
    // Fetch market data in parallel
    console.log('🔄 Starting parallel fetch for 4 symbols: ^GSPC, ^VIX, ^IXIC, ^DJI');
    const fetchStartTime = Date.now();

    const [sp500Data, vixData, nasdaqData, dowData] = await Promise.all([
      fetchYahooFinanceData('^GSPC'), // S&P 500 Index (actual index, not ETF)
      fetchYahooFinanceData('^VIX'),  // VIX Volatility Index
      fetchYahooFinanceData('^IXIC'), // NASDAQ Composite Index (actual index, not ETF)
      fetchYahooFinanceData('^DJI')   // DOW Jones Industrial Average (actual index, not ETF)
    ]) as [MarketDataItem, MarketDataItem, MarketDataItem, MarketDataItem];

    const fetchEndTime = Date.now();
    console.log(`⏱️ Total parallel fetch time: ${fetchEndTime - fetchStartTime}ms`);

    console.log('📊 Direct API responses:', {
      sp500: sp500Data ? '✅ Success' : '❌ Failed',
      vix: vixData ? '✅ Success' : '❌ Failed',
      nasdaq: nasdaqData ? '✅ Success' : '❌ Failed',
      dow: dowData ? '✅ Success' : '❌ Failed'
    });

    // Build market overview response
    const marketOverview: MarketOverviewData = {
      indices: {
        sp500: {
          value: sp500Data.price,
          change: sp500Data.change,
          changePercent: sp500Data.changePercent
        },
        nasdaq: {
          value: nasdaqData.price,
          change: nasdaqData.change,
          changePercent: nasdaqData.changePercent
        },
        dow: {
          value: dowData.price,
          change: dowData.change,
          changePercent: dowData.changePercent
        }
      },
      sectors: [], // No mock sectors data
      economicIndicators: {
        interestRate: null,
        cpi: null,
        unemployment: null
      },
      fearGreedIndex: null,
      vix: {
        value: vixData.price,
        status: vixData.price < 20 ? 'low' : vixData.price > 30 ? 'high' : 'moderate',
        interpretation: vixData.price < 20
          ? 'Low volatility - stable market conditions'
          : vixData.price > 30
          ? 'High volatility - increased market uncertainty'
          : 'Moderate volatility - normal market fluctuations'
      },
      marketSentiment: sp500Data.changePercent > 0.5 ? 'bullish' : sp500Data.changePercent < -0.5 ? 'bearish' : 'neutral',
      volatilityIndex: vixData.price,
      source: 'direct_api_yahoo_finance',
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Direct API: Market overview completed:`, {
      hasIndices: !!marketOverview.indices,
      sp500Value: marketOverview.indices?.sp500?.value,
      source: marketOverview.source
    });

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

