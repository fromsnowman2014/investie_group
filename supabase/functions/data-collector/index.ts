// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types for data collection
interface CollectionJob {
  action: string;
  indicators?: string[];
  indicatorType?: string;  // For collect_indicator action
  source?: string;
  forceRefresh?: boolean;
}

interface MarketIndicator {
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  expires_at?: string;
}

interface CollectionResult {
  success: boolean;
  collected: number;
  errors: string[];
  indicators: MarketIndicator[];
  timestamp: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not configured');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is configured');
}

// Use service role key for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to handle BigInt serialization
function serializeForJSON(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Alpha Vantage API functions
async function fetchFearGreedIndex(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching Fear & Greed Index from Alternative.me...');

    const response = await fetch('https://api.alternative.me/fng/?limit=1&format=json');
    if (!response.ok) {
      throw new Error(`Alternative.me API error: ${response.status}`);
    }

    const data = await response.json();
    const fngData = data.data[0];

    console.log('✅ Fear & Greed Index fetched successfully:', fngData.value);

    return {
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
  } catch (error) {
    console.error('❌ Failed to fetch Fear & Greed Index:', error.message);
    return null;
  }
}

async function fetchSP500Data(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching S&P 500 data from Alpha Vantage...');

    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ ALPHA_VANTAGE_API_KEY not configured, using Yahoo Finance fallback');
      return await fetchSP500FromYahoo();
    }

    // Fetch SPY ETF as S&P 500 proxy
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    if (data['Note'] && data['Note'].includes('API call frequency')) {
      console.warn('⚠️ Alpha Vantage rate limit hit, using Yahoo Finance fallback');
      return await fetchSP500FromYahoo();
    }

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    console.log('✅ S&P 500 (SPY) data fetched successfully:', quote['05. price']);

    return {
      indicator_type: 'sp500',
      data_value: {
        symbol: 'SPY',
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: quote['07. latest trading day']
      },
      metadata: {
        name: 'S&P 500 ETF (SPY)',
        exchange: 'NYSE'
      },
      data_source: 'alpha_vantage',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch S&P 500 from Alpha Vantage:', error.message);
    console.log('🔄 Trying Yahoo Finance fallback...');
    return await fetchSP500FromYahoo();
  }
}

async function fetchSP500FromYahoo(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching S&P 500 data from Yahoo Finance...');

    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/SPY'
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

    console.log('✅ S&P 500 (SPY) data fetched from Yahoo Finance:', latestClose);

    return {
      indicator_type: 'sp500',
      data_value: {
        symbol: 'SPY',
        price: latestClose,
        change: latestClose - meta.previousClose,
        change_percent: ((latestClose - meta.previousClose) / meta.previousClose) * 100,
        volume: latestVolume,
        timestamp: new Date(timestamp * 1000).toISOString().split('T')[0]
      },
      metadata: {
        name: 'S&P 500 ETF (SPY)',
        exchange: 'NYSE'
      },
      data_source: 'yahoo_finance',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch S&P 500 from Yahoo Finance:', error.message);
    return null;
  }
}

async function fetchVIXData(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching VIX data from Alpha Vantage...');

    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ ALPHA_VANTAGE_API_KEY not configured, using Yahoo Finance fallback');
      return await fetchVIXFromYahoo();
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    if (data['Note'] && data['Note'].includes('API call frequency')) {
      console.warn('⚠️ Alpha Vantage rate limit hit, using Yahoo Finance fallback');
      return await fetchVIXFromYahoo();
    }

    const quote = data['Global Quote'];
    if (!quote) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    console.log('✅ VIX data fetched successfully:', quote['05. price']);

    return {
      indicator_type: 'vix',
      data_value: {
        symbol: 'VIX',
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
        timestamp: quote['07. latest trading day']
      },
      metadata: {
        name: 'CBOE Volatility Index (VIX)',
        description: 'Market volatility fear gauge'
      },
      data_source: 'alpha_vantage',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch VIX from Alpha Vantage:', error.message);
    return await fetchVIXFromYahoo();
  }
}

async function fetchVIXFromYahoo(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching VIX data from Yahoo Finance...');

    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX'
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

    console.log('✅ VIX data fetched from Yahoo Finance:', latestClose);

    return {
      indicator_type: 'vix',
      data_value: {
        symbol: 'VIX',
        price: latestClose,
        change: latestClose - meta.previousClose,
        change_percent: ((latestClose - meta.previousClose) / meta.previousClose) * 100,
        timestamp: new Date(timestamp * 1000).toISOString().split('T')[0]
      },
      metadata: {
        name: 'CBOE Volatility Index (VIX)',
        description: 'Market volatility fear gauge'
      },
      data_source: 'yahoo_finance',
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch VIX from Yahoo Finance:', error.message);
    return null;
  }
}

// FRED API functions for economic indicators
async function fetchTreasury10Y(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching 10-Year Treasury rate from FRED...');

    const apiKey = Deno.env.get('FRED_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ FRED_API_KEY not configured, skipping Treasury data');
      return null;
    }

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();
    const observation = data.observations[0];

    if (observation.value === '.') {
      throw new Error('No Treasury data available');
    }

    console.log('✅ 10-Year Treasury rate fetched successfully:', observation.value);

    return {
      indicator_type: 'treasury_10y',
      data_value: {
        rate: parseFloat(observation.value),
        date: observation.date,
        unit: 'percent'
      },
      metadata: {
        name: '10-Year Treasury Constant Maturity Rate',
        source: 'Federal Reserve Economic Data (FRED)',
        series_id: 'DGS10'
      },
      data_source: 'fred',
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch Treasury data from FRED:', error.message);
    return null;
  }
}

async function fetchUnemploymentRate(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching unemployment rate from FRED...');

    const apiKey = Deno.env.get('FRED_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ FRED_API_KEY not configured, skipping unemployment data');
      return null;
    }

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();
    const observation = data.observations[0];

    if (observation.value === '.') {
      throw new Error('No unemployment data available');
    }

    console.log('✅ Unemployment rate fetched successfully:', observation.value);

    return {
      indicator_type: 'unemployment',
      data_value: {
        rate: parseFloat(observation.value),
        date: observation.date,
        unit: 'percent'
      },
      metadata: {
        name: 'Unemployment Rate',
        source: 'Federal Reserve Economic Data (FRED)',
        series_id: 'UNRATE'
      },
      data_source: 'fred',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch unemployment data from FRED:', error.message);
    return null;
  }
}

async function fetchCPIData(): Promise<MarketIndicator | null> {
  try {
    console.log('🔍 Fetching CPI data from FRED...');

    const apiKey = Deno.env.get('FRED_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ FRED_API_KEY not configured, skipping CPI data');
      return null;
    }

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();
    const [current, previous] = data.observations;

    if (current.value === '.' || previous.value === '.') {
      throw new Error('No CPI data available');
    }

    const currentValue = parseFloat(current.value);
    const previousValue = parseFloat(previous.value);
    const changePercent = ((currentValue - previousValue) / previousValue) * 100;

    console.log('✅ CPI data fetched successfully:', currentValue);

    return {
      indicator_type: 'cpi',
      data_value: {
        value: currentValue,
        previous_value: previousValue,
        change_percent: changePercent,
        date: current.date,
        unit: 'index_1982_1984=100'
      },
      metadata: {
        name: 'Consumer Price Index for All Urban Consumers: All Items',
        source: 'Federal Reserve Economic Data (FRED)',
        series_id: 'CPIAUCSL'
      },
      data_source: 'fred',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  } catch (error) {
    console.error('❌ Failed to fetch CPI data from FRED:', error.message);
    return null;
  }
}

// Save indicators to database
async function saveIndicatorsToDatabase(indicators: MarketIndicator[]): Promise<void> {
  if (indicators.length === 0) {
    console.log('⚠️ No indicators to save');
    return;
  }

  console.log(`💾 Saving ${indicators.length} indicators to database...`);

  for (const indicator of indicators) {
    try {
      // First, mark existing indicators as inactive (soft delete)
      await supabase
        .from('market_indicators_cache')
        .update({ is_active: false })
        .eq('indicator_type', indicator.indicator_type);

      // Insert new indicator
      const { error } = await supabase
        .from('market_indicators_cache')
        .insert({
          indicator_type: indicator.indicator_type,
          data_value: indicator.data_value,
          metadata: indicator.metadata || {},
          data_source: indicator.data_source,
          expires_at: indicator.expires_at,
          is_active: true
        });

      if (error) {
        console.error(`❌ Failed to save ${indicator.indicator_type}:`, error.message);
      } else {
        console.log(`✅ Saved ${indicator.indicator_type} to database`);
      }
    } catch (error) {
      console.error(`💥 Exception saving ${indicator.indicator_type}:`, error.message);
    }
  }
}

// Collect specific indicator for background revalidation
async function collectSpecificIndicator(indicatorType: string, source: string = 'api'): Promise<CollectionResult> {
  console.log(`🔄 Collecting specific indicator: ${indicatorType} (source: ${source})`);

  const indicatorCollectors: Record<string, () => Promise<MarketIndicator | null>> = {
    'fear_greed': fetchFearGreedIndex,
    'sp500': fetchSP500Data,
    'vix': fetchVIXData,
    'treasury_10y': fetchTreasury10Y,
    'unemployment': fetchUnemploymentRate,
    'cpi': fetchCPIData
  };

  const collector = indicatorCollectors[indicatorType];
  if (!collector) {
    console.error(`❌ Unknown indicator type: ${indicatorType}`);
    return {
      success: false,
      collected: 0,
      errors: [`Unknown indicator type: ${indicatorType}`],
      indicators: [],
      timestamp: new Date().toISOString()
    };
  }

  try {
    const indicator = await collector();
    if (indicator) {
      // Save to database
      const saved = await saveIndicatorsToDatabase([indicator]);

      console.log(`✅ Successfully collected and saved ${indicatorType}`);
      return {
        success: true,
        collected: 1,
        errors: [],
        indicators: [indicator],
        timestamp: new Date().toISOString()
      };
    } else {
      console.warn(`⚠️ No data collected for ${indicatorType}`);
      return {
        success: false,
        collected: 0,
        errors: [`No data collected for ${indicatorType}`],
        indicators: [],
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    const errorMsg = `${indicatorType}: ${error.message}`;
    console.error(`❌ Collection error: ${errorMsg}`);
    return {
      success: false,
      collected: 0,
      errors: [errorMsg],
      indicators: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Collect all market indicators
async function collectAllMarketIndicators(): Promise<CollectionResult> {
  console.log('🚀 Starting comprehensive market data collection...');

  const collectors = [
    fetchFearGreedIndex,
    fetchSP500Data,
    fetchVIXData,
    fetchTreasury10Y,
    fetchUnemploymentRate,
    fetchCPIData
  ];

  const indicators: MarketIndicator[] = [];
  const errors: string[] = [];

  // Collect data from all sources
  for (const collector of collectors) {
    try {
      const indicator = await collector();
      if (indicator) {
        indicators.push(indicator);
      }
    } catch (error) {
      const errorMsg = `${collector.name}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ Collection error: ${errorMsg}`);
    }
  }

  // Save to database
  try {
    await saveIndicatorsToDatabase(indicators);
  } catch (error) {
    errors.push(`Database save error: ${error.message}`);
    console.error('❌ Database save failed:', error.message);
  }

  const result: CollectionResult = {
    success: indicators.length > 0,
    collected: indicators.length,
    errors,
    indicators: serializeForJSON(indicators),
    timestamp: new Date().toISOString()
  };

  console.log(`📊 Collection complete: ${indicators.length} indicators collected, ${errors.length} errors`);

  return result;
}

// Health check
async function performHealthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
  try {
    console.log('🔧 Performing health check...');

    // Test database connection
    const { count, error } = await supabase
      .from('market_indicators_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Check environment variables
    const apiKeys = {
      alpha_vantage: !!Deno.env.get('ALPHA_VANTAGE_API_KEY'),
      fred: !!Deno.env.get('FRED_API_KEY'),
      supabase_service: !!supabaseServiceKey
    };

    return serializeForJSON({
      status: 'healthy',
      details: {
        database: 'connected',
        activeIndicators: count || 0,
        apiKeys,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return serializeForJSON({
      status: 'unhealthy',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Main request handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const job: CollectionJob = await req.json();

    if (job.action === 'collect_all') {
      const result = await collectAllMarketIndicators();

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else if (job.action === 'collect_indicator') {
      // Collect specific indicator for background revalidation
      if (!job.indicatorType) {
        return new Response(JSON.stringify({
          error: 'indicatorType is required for collect_indicator action'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const result = await collectSpecificIndicator(job.indicatorType, job.source || 'api');

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else if (job.action === 'health') {
      const health = await performHealthCheck();

      return new Response(JSON.stringify(health), {
        status: health.status === 'healthy' ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use "collect_all", "collect_indicator", or "health"'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Data collector function error:', error.message);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});