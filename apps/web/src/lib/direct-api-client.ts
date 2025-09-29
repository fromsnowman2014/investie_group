// Direct API Client - Frontend에서 직접 API 호출
// Supabase Edge Functions을 거치지 않고 직접 외부 API 호출

/**
 * Rate Limiter for API calls
 */
class APIRateLimiter {
  private limits = new Map<string, { count: number; resetTime: number; limit: number }>();

  checkLimit(provider: string, dailyLimit: number = 25): boolean {
    const key = provider;
    const existing = this.limits.get(key);

    // Reset daily counter at midnight UTC
    const startOfDay = new Date().setUTCHours(0, 0, 0, 0);

    if (!existing || existing.resetTime < startOfDay) {
      this.limits.set(key, { count: 0, resetTime: startOfDay + 24 * 60 * 60 * 1000, limit: dailyLimit });
      return true;
    }

    if (existing.count >= existing.limit) {
      console.warn(`🚫 Rate limit exceeded for ${provider}: ${existing.count}/${existing.limit}`);
      return false;
    }

    return true;
  }

  incrementCount(provider: string): void {
    const key = provider;
    const existing = this.limits.get(key);
    if (existing) {
      existing.count += 1;
      this.limits.set(key, existing);
      console.log(`📊 API usage for ${provider}: ${existing.count}/${existing.limit}`);
    }
  }

  getUsage(provider: string): { used: number; limit: number; remaining: number } {
    const existing = this.limits.get(provider);
    if (!existing) return { used: 0, limit: 25, remaining: 25 };
    return {
      used: existing.count,
      limit: existing.limit,
      remaining: Math.max(0, existing.limit - existing.count)
    };
  }
}

// Global rate limiter instance
const rateLimiter = new APIRateLimiter();

/**
 * Market Indicator interface
 */
interface MarketIndicator {
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  expires_at?: string;
  validation?: {
    status: 'success' | 'warning' | 'error';
    message?: string;
    dataAge?: number;
    isStale?: boolean;
  };
}

/**
 * API Response wrapper
 */
interface APIResponse<T> {
  data: T | null;
  source: 'alpha_vantage' | 'fred' | 'yahoo_finance' | 'twelve_data' | 'error';
  success: boolean;
  error?: string;
  rateLimited?: boolean;
  usageInfo?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

/**
 * Alpha Vantage API 직접 호출
 */
export async function fetchStockDataDirect(symbol: string): Promise<APIResponse<MarketIndicator>> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ ALPHA_VANTAGE_API_KEY not configured, using Yahoo Finance fallback');
    return await fetchStockFromYahoo(symbol);
  }

  // Rate limiting check
  if (!rateLimiter.checkLimit('alpha_vantage', 25)) {
    console.warn('🚫 Alpha Vantage rate limit exceeded, using Yahoo Finance fallback');
    return await fetchStockFromYahoo(symbol);
  }

  try {
    console.log(`🔍 Fetching ${symbol} from Alpha Vantage...`);

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Check for rate limit response
    if (data['Note'] && data['Note'].includes('API call frequency')) {
      rateLimiter.incrementCount('alpha_vantage');
      console.warn('⚠️ Alpha Vantage rate limit hit, using Yahoo Finance fallback');
      return await fetchStockFromYahoo(symbol);
    }

    rateLimiter.incrementCount('alpha_vantage');

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    console.log(`✅ ${symbol} data fetched from Alpha Vantage: ${quote['05. price']}`);

    const result: MarketIndicator = {
      indicator_type: 'stock_' + symbol.toLowerCase(),
      data_value: {
        symbol: symbol,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: quote['07. latest trading day']
      },
      metadata: {
        name: `Stock Quote - ${symbol}`,
        exchange: 'US'
      },
      data_source: 'alpha_vantage',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    return {
      data: result,
      source: 'alpha_vantage',
      success: true,
      usageInfo: rateLimiter.getUsage('alpha_vantage')
    };

  } catch (error) {
    console.error(`❌ Alpha Vantage fetch failed for ${symbol}:`, error);

    // Fallback to Yahoo Finance
    console.log(`🔄 Falling back to Yahoo Finance for ${symbol}...`);
    return await fetchStockFromYahoo(symbol);
  }
}

/**
 * Yahoo Finance 백업 API (무료, rate limit 없음)
 */
async function fetchStockFromYahoo(symbol: string): Promise<APIResponse<MarketIndicator>> {
  try {
    console.log(`🔍 Fetching ${symbol} from Yahoo Finance...`);

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    const timestamp = result.timestamp[result.timestamp.length - 1];
    const latestClose = quote.close[quote.close.length - 1];
    const latestVolume = quote.volume[quote.volume.length - 1];

    console.log(`✅ ${symbol} data fetched from Yahoo Finance: ${latestClose}`);

    const marketIndicator: MarketIndicator = {
      indicator_type: 'stock_' + symbol.toLowerCase(),
      data_value: {
        symbol: symbol,
        price: latestClose,
        change: latestClose - meta.previousClose,
        change_percent: ((latestClose - meta.previousClose) / meta.previousClose) * 100,
        volume: latestVolume,
        timestamp: new Date(timestamp * 1000).toISOString().split('T')[0]
      },
      metadata: {
        name: `Stock Quote - ${symbol}`,
        exchange: 'US'
      },
      data_source: 'yahoo_finance',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };

    return {
      data: marketIndicator,
      source: 'yahoo_finance',
      success: true
    };

  } catch (error) {
    console.error(`❌ Yahoo Finance fetch failed for ${symbol}:`, error);

    return {
      data: null,
      source: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * S&P 500 데이터 직접 호출
 */
export async function fetchSP500DataDirect(): Promise<APIResponse<MarketIndicator>> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

  if (!apiKey || !rateLimiter.checkLimit('alpha_vantage', 25)) {
    console.warn('⚠️ Using Yahoo Finance for S&P 500 data');
    return await fetchSP500FromYahoo();
  }

  try {
    console.log('🔍 Fetching S&P 500 from Alpha Vantage...');

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%5EGSPC&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    if (data['Note'] && data['Note'].includes('API call frequency')) {
      console.warn('⚠️ Alpha Vantage rate limit hit, using Yahoo Finance fallback');
      return await fetchSP500FromYahoo();
    }

    rateLimiter.incrementCount('alpha_vantage');

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    console.log(`✅ S&P 500 data fetched from Alpha Vantage: ${quote['05. price']}`);

    const result: MarketIndicator = {
      indicator_type: 'sp500',
      data_value: {
        symbol: '^GSPC',
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: quote['07. latest trading day']
      },
      metadata: {
        name: 'S&P 500 Index',
        exchange: 'INDEX'
      },
      data_source: 'alpha_vantage',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };

    return {
      data: result,
      source: 'alpha_vantage',
      success: true,
      usageInfo: rateLimiter.getUsage('alpha_vantage')
    };

  } catch (error) {
    console.error('❌ Alpha Vantage S&P 500 fetch failed:', error);
    return await fetchSP500FromYahoo();
  }
}

/**
 * S&P 500 Yahoo Finance 백업
 */
async function fetchSP500FromYahoo(): Promise<APIResponse<MarketIndicator>> {
  try {
    console.log('🔍 Fetching S&P 500 from Yahoo Finance...');

    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC'
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    const timestamp = result.timestamp[result.timestamp.length - 1];
    const latestClose = quote.close[quote.close.length - 1];
    const latestVolume = quote.volume[quote.volume.length - 1];

    console.log('✅ S&P 500 data fetched from Yahoo Finance:', latestClose);

    const marketIndicator: MarketIndicator = {
      indicator_type: 'sp500',
      data_value: {
        symbol: '^GSPC',
        price: latestClose,
        change: latestClose - meta.previousClose,
        change_percent: ((latestClose - meta.previousClose) / meta.previousClose) * 100,
        volume: latestVolume,
        timestamp: new Date(timestamp * 1000).toISOString().split('T')[0]
      },
      metadata: {
        name: 'S&P 500 Index',
        exchange: 'INDEX'
      },
      data_source: 'yahoo_finance',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };

    return {
      data: marketIndicator,
      source: 'yahoo_finance',
      success: true
    };

  } catch (error) {
    console.error('❌ Yahoo Finance S&P 500 fetch failed:', error);

    return {
      data: null,
      source: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * FRED API 직접 호출 (경제 지표)
 */
export async function fetchEconomicDataDirect(seriesId: string): Promise<APIResponse<MarketIndicator>> {
  const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ FRED_API_KEY not configured, skipping economic data');
    return {
      data: null,
      source: 'error',
      success: false,
      error: 'FRED API key not configured'
    };
  }

  // FRED has higher rate limits, but still check
  if (!rateLimiter.checkLimit('fred', 1000)) {
    return {
      data: null,
      source: 'error',
      success: false,
      error: 'FRED API rate limit exceeded',
      rateLimited: true
    };
  }

  try {
    console.log(`🔍 Fetching ${seriesId} from FRED...`);

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();
    rateLimiter.incrementCount('fred');

    const observation = data.observations[0];

    if (observation.value === '.') {
      throw new Error(`No ${seriesId} data available`);
    }

    console.log(`✅ ${seriesId} data fetched from FRED: ${observation.value}`);

    // Map series ID to indicator type
    const indicatorTypeMap: Record<string, string> = {
      'DGS10': 'treasury_10y',
      'UNRATE': 'unemployment',
      'CPIAUCSL': 'cpi'
    };

    const nameMap: Record<string, string> = {
      'DGS10': '10-Year Treasury Constant Maturity Rate',
      'UNRATE': 'Unemployment Rate',
      'CPIAUCSL': 'Consumer Price Index for All Urban Consumers: All Items'
    };

    const result: MarketIndicator = {
      indicator_type: indicatorTypeMap[seriesId] || seriesId.toLowerCase(),
      data_value: {
        rate: parseFloat(observation.value),
        value: parseFloat(observation.value),
        date: observation.date,
        unit: seriesId === 'DGS10' || seriesId === 'UNRATE' ? 'percent' : 'index_1982_1984=100'
      },
      metadata: {
        name: nameMap[seriesId] || `Economic Indicator ${seriesId}`,
        source: 'Federal Reserve Economic Data (FRED)',
        series_id: seriesId
      },
      data_source: 'fred',
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
    };

    return {
      data: result,
      source: 'fred',
      success: true,
      usageInfo: rateLimiter.getUsage('fred')
    };

  } catch (error) {
    console.error(`❌ FRED fetch failed for ${seriesId}:`, error);

    return {
      data: null,
      source: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fear & Greed Index 직접 호출 (Alternative.me - 무료 API)
 */
export async function fetchFearGreedIndexDirect(): Promise<APIResponse<MarketIndicator>> {
  try {
    console.log('🔍 Fetching Fear & Greed Index from Alternative.me...');

    const response = await fetch('https://api.alternative.me/fng/?limit=1&format=json');

    if (!response.ok) {
      throw new Error(`Alternative.me API error: ${response.status}`);
    }

    const data = await response.json();
    const fngData = data.data[0];

    console.log('✅ Fear & Greed Index fetched:', fngData.value);

    const result: MarketIndicator = {
      indicator_type: 'fear_greed',
      data_value: {
        value: parseInt(fngData.value),
        timestamp: fngData.timestamp,
        classification: fngData.value_classification,
        time_until_update: fngData.time_until_update
      },
      metadata: {
        name: 'Fear & Greed Index',
        source: 'Alternative.me',
        description: 'Market sentiment indicator (0-100)'
      },
      data_source: 'alternative_me',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    return {
      data: result,
      source: 'yahoo_finance', // Using yahoo_finance as generic "free API" source
      success: true
    };

  } catch (error) {
    console.error('❌ Fear & Greed Index fetch failed:', error);

    return {
      data: null,
      source: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 종합 마켓 데이터 수집 (모든 지표를 병렬로 호출)
 */
export async function fetchMarketDataDirect(): Promise<{
  indicators: MarketIndicator[];
  sources: string[];
  errors: string[];
  usageInfo: Record<string, { used: number; limit: number; remaining: number }>;
}> {
  console.log('🚀 Starting direct market data collection...');

  const promises = [
    fetchSP500DataDirect(),
    fetchStockDataDirect('VIX'),
    fetchEconomicDataDirect('DGS10'),
    fetchEconomicDataDirect('UNRATE'),
    fetchFearGreedIndexDirect()
  ];

  const results = await Promise.allSettled(promises);

  const indicators: MarketIndicator[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success && result.value.data) {
      indicators.push(result.value.data);
      sources.push(result.value.source);
    } else if (result.status === 'fulfilled' && !result.value.success) {
      errors.push(result.value.error || 'Unknown error');
    } else if (result.status === 'rejected') {
      errors.push(result.reason?.message || 'Promise rejected');
    }
  });

  const usageInfo = {
    alpha_vantage: rateLimiter.getUsage('alpha_vantage'),
    fred: rateLimiter.getUsage('fred')
  };

  console.log(`📊 Direct market data collection complete: ${indicators.length} indicators, ${errors.length} errors`);

  return {
    indicators,
    sources,
    errors,
    usageInfo
  };
}

/**
 * Rate Limiter 상태 조회
 */
export function getAPIUsageStatus() {
  return {
    alpha_vantage: rateLimiter.getUsage('alpha_vantage'),
    fred: rateLimiter.getUsage('fred')
  };
}