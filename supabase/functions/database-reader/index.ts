// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Types for cached data queries
interface CachedDataQuery {
  indicatorType?: string;
  maxAge?: number;          // Override configuration values (seconds)
  fallbackToAPI?: boolean;  // Real-time API call on cache failure
  forceRefresh?: boolean;   // Force refresh request
  action: string;
}

interface CacheConfig {
  maxAge: number;           // Default 12 hours (43200 seconds)
  staleWhileRevalidate: number;  // Background refresh allowance time
  retryAttempts: number;    // API call retry count
  fallbackEnabled: boolean; // Fallback activation
}

interface MarketData {
  id?: number;
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  created_at: string;
  expires_at?: string;
  age_seconds?: number;
  source?: 'cache' | 'realtime' | 'fallback';
  freshness?: {
    ageInSeconds: number;
    ageInHours: number;
    freshness: number;
    isStale: boolean;
  };
}

interface MarketOverviewResponse {
  fearGreedIndex?: MarketData;
  economicIndicators?: MarketData[];
  marketIndicators?: MarketData[];
  sp500Data?: MarketData;
  vixData?: MarketData;
  lastUpdated: string;
  source: 'cache' | 'mixed' | 'realtime';
  cacheInfo: {
    totalIndicators: number;
    freshIndicators: number;
    staleIndicators: number;
    cacheHitRate: number;
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not configured');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY is configured');
}

if (!supabaseAnonKey) {
  console.error('❌ SUPABASE_ANON_KEY is not configured');
} else {
  console.log('✅ SUPABASE_ANON_KEY is configured');
}

// Create function to initialize Supabase client with enhanced configuration
function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'x-application-name': 'database-reader'
      }
    }
  });
}

// Use service role key for database operations
const supabase = createSupabaseClient()

// Helper function to handle BigInt serialization
function serializeForJSON(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// Load configuration values from cache_config table or environment variables
async function loadCacheConfig(): Promise<CacheConfig> {
  try {
    const { data: configs, error } = await supabase
      .from('cache_config')
      .select('config_key, config_value');

    if (error) {
      console.warn('⚠️ Failed to load cache config from database:', error.message);
    }

    // Create config map with defaults
    const configMap = new Map<string, string>();
    if (configs) {
      configs.forEach(config => configMap.set(config.config_key, config.config_value));
    }

    return {
      maxAge: parseInt(configMap.get('cache_max_age_hours') || Deno.env.get('CACHE_MAX_AGE_HOURS') || '12') * 3600,
      staleWhileRevalidate: parseInt(configMap.get('cache_stale_hours') || Deno.env.get('CACHE_STALE_HOURS') || '6') * 3600,
      retryAttempts: parseInt(configMap.get('api_retry_attempts') || Deno.env.get('API_RETRY_ATTEMPTS') || '3'),
      fallbackEnabled: (configMap.get('cache_fallback_enabled') || Deno.env.get('CACHE_FALLBACK_ENABLED') || 'true') !== 'false'
    };
  } catch (error) {
    console.error('❌ Error loading cache config:', error.message);

    // Return defaults
    return {
      maxAge: 12 * 3600, // 12 hours
      staleWhileRevalidate: 6 * 3600, // 6 hours
      retryAttempts: 3,
      fallbackEnabled: true
    };
  }
}

// Query cached data from database (simplified version)
async function queryFromCache(indicatorType: string): Promise<MarketData | null> {
  try {
    console.log(`🔍 Querying cache for indicator: ${indicatorType}`);

    // Enhanced debugging - first check if any data exists in the table
    const { data: allData, error: allError } = await supabase
      .from('market_indicators_cache')
      .select('indicator_type, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error(`❌ Error checking all table data:`, allError);
      return {
        error: `Database access failed: ${allError.message}`,
        totalRecords: 0,
        availableIndicators: []
      };
    } else {
      console.log(`📊 Total records in table: ${allData?.length || 0}`);
      console.log(`📋 Available indicators:`, allData?.map(d => `${d.indicator_type}(active:${d.is_active})`).join(', '));

      // Return debug info for this specific query
      const debugResult = {
        totalRecords: allData?.length || 0,
        availableIndicators: allData?.map(d => `${d.indicator_type}(active:${d.is_active})`) || [],
        searchingFor: indicatorType
      };

      if (allData?.length === 0) {
        return {
          error: `No data in table at all - database is empty`,
          ...debugResult
        };
      }
    }

    const { data, error } = await supabase
      .from('market_indicators_cache')
      .select(`
        id,
        indicator_type,
        data_value,
        metadata,
        data_source,
        created_at,
        expires_at
      `)
      .eq('indicator_type', indicatorType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`❌ Cache query error for ${indicatorType}:`, JSON.stringify(error, null, 2));
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`📭 No cached data found for ${indicatorType}`);
      // Additional debug: check if data exists without is_active filter
      const { data: inactiveData } = await supabase
        .from('market_indicators_cache')
        .select('indicator_type, is_active, created_at')
        .eq('indicator_type', indicatorType)
        .order('created_at', { ascending: false })
        .limit(3);

      if (inactiveData && inactiveData.length > 0) {
        console.log(`🔍 Found inactive data for ${indicatorType}:`, inactiveData.map(d => `active:${d.is_active}, created:${d.created_at}`));
      }
      return null;
    }

    const result = data[0];
    const ageSeconds = Math.floor((Date.now() - new Date(result.created_at).getTime()) / 1000);

    console.log(`✅ Found cached data for ${indicatorType}, age: ${ageSeconds}s`);

    return {
      ...result,
      age_seconds: ageSeconds,
      source: 'cache' as const,
      freshness: calculateFreshness(ageSeconds, 12 * 3600) // 12 hours default
    };

  } catch (error) {
    console.error(`💥 Cache query exception for ${indicatorType}:`, error.message);
    return null;
  }
}

// Calculate data freshness metrics
function calculateFreshness(ageSeconds: number, maxAge: number) {
  const ageInHours = Math.floor(ageSeconds / 3600);
  const freshness = Math.max(0, 100 - (ageSeconds / maxAge) * 100);
  const isStale = ageSeconds > maxAge;

  return {
    ageInSeconds: ageSeconds,
    ageInHours,
    freshness: Math.round(freshness),
    isStale
  };
}

// Data freshness validation functions
function isDataFresh(data: MarketData, maxAge: number): boolean {
  return (data.age_seconds || 0) < maxAge;
}

function isDataStale(data: MarketData, maxAge: number, staleThreshold: number): boolean {
  const age = data.age_seconds || 0;
  return age >= maxAge && age < (maxAge + staleThreshold);
}

// Get cached market data with smart cache strategy
async function getCachedMarketData(query: CachedDataQuery): Promise<MarketData | null> {
  const config = await loadCacheConfig();
  const maxAge = query.maxAge || config.maxAge;

  if (!query.indicatorType) {
    throw new Error('indicatorType is required');
  }

  console.log(`🔍 Querying cached data for ${query.indicatorType} (maxAge: ${maxAge}s)`);

  // 1. Query latest data from cache
  const cachedData = await queryFromCache(query.indicatorType);

  // 2. Handle force refresh request
  if (query.forceRefresh) {
    console.log(`🔄 Force refresh requested for ${query.indicatorType}`);
    // For now, return cached data (in production, this would trigger API refresh)
    return cachedData;
  }

  // 3. Data freshness validation
  if (cachedData && isDataFresh(cachedData, maxAge)) {
    console.log(`✅ Fresh cache hit for ${query.indicatorType} (${cachedData.age_seconds}s old)`);
    return cachedData;
  }

  // 4. Stale-While-Revalidate pattern
  if (cachedData && isDataStale(cachedData, maxAge, config.staleWhileRevalidate)) {
    console.log(`🔄 Serving stale data while revalidating ${query.indicatorType}`);

    // Background data refresh - trigger async revalidation
    revalidateDataInBackground(query.indicatorType).catch(error => {
      console.error(`❌ Background revalidation failed for ${query.indicatorType}:`, error.message);
    });

    return {
      ...cachedData,
      source: 'cache' as const,
      freshness: {
        ...cachedData.freshness!,
        isStale: true
      }
    };
  }

  // 5. Cache miss or very stale data
  if (cachedData) {
    console.warn(`⚠️ Returning stale cache data for ${query.indicatorType} (${cachedData.age_seconds}s old)`);
    return {
      ...cachedData,
      source: 'cache' as const,
      freshness: {
        ...cachedData.freshness!,
        isStale: true
      }
    };
  }

  // 6. No data available
  console.warn(`❌ No cached data available for ${query.indicatorType}`);
  return null;
}

// Get comprehensive market overview
async function getMarketOverview(maxAge?: number): Promise<MarketOverviewResponse> {
  console.log('📊 Getting comprehensive market overview...');

  const indicators = [
    'fear_greed',
    'sp500',
    'vix',
    'treasury_10y',
    'unemployment',
    'cpi'
  ];

  const results: MarketData[] = [];
  let freshCount = 0;
  let staleCount = 0;
  const debugInfo: string[] = [];

  debugInfo.push(`🔧 DEBUG: Starting market overview collection for ${indicators.length} indicators`);

  // Fetch all indicators
  for (const indicatorType of indicators) {
    try {
      debugInfo.push(`🔍 DEBUG: Fetching ${indicatorType}...`);
      const data = await getCachedMarketData({
        indicatorType,
        maxAge,
        action: 'get_cached_data'
      });

      if (data) {
        debugInfo.push(`✅ DEBUG: Found ${indicatorType} data from ${data.source} (${data.age_seconds}s old)`);
        results.push(data);
        if (data.freshness?.isStale) {
          staleCount++;
        } else {
          freshCount++;
        }
      } else {
        debugInfo.push(`❌ DEBUG: No data found for ${indicatorType}`);
      }
    } catch (error) {
      debugInfo.push(`💥 DEBUG: Error fetching ${indicatorType}: ${error.message}`);
      console.error(`❌ Error fetching ${indicatorType}:`, error.message);
    }
  }

  // Organize data by type
  const fearGreedIndex = results.find(r => r.indicator_type === 'fear_greed');
  const sp500Data = results.find(r => r.indicator_type === 'sp500');
  const vixData = results.find(r => r.indicator_type === 'vix');

  const economicIndicators = results.filter(r =>
    ['treasury_10y', 'unemployment', 'cpi'].includes(r.indicator_type)
  );

  const marketIndicators = results.filter(r =>
    ['sp500', 'vix'].includes(r.indicator_type)
  );

  const cacheHitRate = results.length > 0 ? (results.length / indicators.length) * 100 : 0;
  const mostRecentUpdate = results.reduce((latest, current) => {
    return new Date(current.created_at) > new Date(latest) ? current.created_at : latest;
  }, '1970-01-01T00:00:00Z');

  debugInfo.push(`📈 DEBUG: Market overview complete: ${results.length}/${indicators.length} indicators (${freshCount} fresh, ${staleCount} stale)`);
  console.log(`📈 Market overview complete: ${results.length}/${indicators.length} indicators (${freshCount} fresh, ${staleCount} stale)`);

  return {
    fearGreedIndex,
    sp500Data,
    vixData,
    economicIndicators,
    marketIndicators,
    lastUpdated: mostRecentUpdate,
    source: freshCount > staleCount ? 'cache' : 'mixed',
    cacheInfo: {
      totalIndicators: results.length,
      freshIndicators: freshCount,
      staleIndicators: staleCount,
      cacheHitRate: Math.round(cacheHitRate)
    },
    // Temporary debug information
    debugInfo: debugInfo
  };
}

// Health check function (simplified)
async function performHealthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
  try {
    console.log('🔧 Performing health check...');

    // Test database connection with count query
    const { count, error } = await supabase
      .from('market_indicators_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    const indicatorCount = count || 0;
    console.log(`📊 Found ${indicatorCount} active indicators`);

    return serializeForJSON({
      status: 'healthy',
      details: {
        database: 'connected',
        connectionType: 'postgrest',
        availableIndicators: indicatorCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return serializeForJSON({
      status: 'unhealthy',
      details: {
        database: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Background data revalidation function
async function revalidateDataInBackground(indicatorType: string): Promise<void> {
  try {
    console.log(`🔄 Starting background revalidation for ${indicatorType}`);

    // Get current Supabase URL for internal function calls
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    const functionsUrl = isLocal ?
      'http://127.0.0.1:54321/functions/v1' :
      `${supabaseUrl}/functions/v1`;

    // Call data-collector to refresh specific indicator
    const response = await fetch(`${functionsUrl}/data-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'collect_indicator',
        indicatorType: indicatorType,
        source: 'background_revalidation'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Background revalidation completed for ${indicatorType}:`, result);
    } else {
      const errorText = await response.text();
      console.error(`❌ Background revalidation failed for ${indicatorType}:`, response.status, errorText);
    }

  } catch (error) {
    console.error(`💥 Background revalidation error for ${indicatorType}:`, error.message);
  }
}

// Trigger background revalidation for all stale indicators
async function revalidateAllStaleData(): Promise<void> {
  try {
    console.log('🔄 Starting background revalidation for all stale data');

    const functionsUrl = Deno.env.get('SUPABASE_URL')?.includes('127.0.0.1') ?
      'http://127.0.0.1:54321/functions/v1' :
      `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

    const response = await fetch(`${functionsUrl}/data-collector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'collect_all',
        source: 'background_revalidation'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Background revalidation completed for all indicators:', result);
    } else {
      console.error('❌ Background revalidation failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('💥 Background revalidation error:', error.message);
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
    const query: CachedDataQuery = await req.json();

    if (query.action === 'get_market_overview') {
      const overview = await getMarketOverview(query.maxAge);

      return new Response(JSON.stringify(overview), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      });

    } else if (query.action === 'get_cached_data' && query.indicatorType) {
      const data = await getCachedMarketData(query);

      return new Response(JSON.stringify(data || { error: 'No data found' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': data ? 'public, max-age=300' : 'no-cache'
        }
      });

    } else if (query.action === 'health') {
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
        error: 'Invalid action. Use "get_market_overview", "get_cached_data", or "health"'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Database reader function error:', error.message);

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