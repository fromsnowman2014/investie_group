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

// Use service role key for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

// Query cached data from database
async function queryFromCache(indicatorType: string): Promise<MarketData | null> {
  try {
    console.log(`🔍 Querying cache for indicator: ${indicatorType}`);
    
    // Use direct SQL query instead of RPC function to avoid potential permission issues
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
      console.error(`❌ Cache query error for ${indicatorType}:`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`📭 No cached data found for ${indicatorType}`);
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
    // Background data refresh would happen here in production
    // For now, return the stale data with appropriate marking
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
async function getMarketOverview(): Promise<MarketOverviewResponse> {
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

  // Fetch all indicators
  for (const indicatorType of indicators) {
    try {
      const data = await getCachedMarketData({
        indicatorType,
        action: 'get_cached_data'
      });

      if (data) {
        results.push(data);
        if (data.freshness?.isStale) {
          staleCount++;
        } else {
          freshCount++;
        }
      }
    } catch (error) {
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
    }
  };
}

// Health check function
async function performHealthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
  try {
    // Debug environment variables
    console.log('🔧 Environment Variables Debug:');
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET');
    console.log('SERVICE_ROLE_KEY:', Deno.env.get('SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', Deno.env.get('SUPABASE_ANON_KEY') ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'SET' : 'NOT SET');
    
    // Test database connection with existing table first
    console.log('🔧 Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key exists:', !!supabaseServiceKey);
    console.log('Service Key length:', supabaseServiceKey.length);
    
    const { data: testData, error: dbError } = await supabase
      .from('stock_data')
      .select('id')
      .limit(1);

    if (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return {
        status: 'unhealthy',
        details: {
          database: 'failed',
          error: dbError.message,
          errorCode: dbError.code,
          errorDetails: dbError.details,
          hint: dbError.hint,
          timestamp: new Date().toISOString(),
          debugInfo: {
            url: supabaseUrl,
            hasKey: !!supabaseServiceKey,
            keyLength: supabaseServiceKey.length
          }
        }
      };
    }

    // Test cache table access
    console.log('🔍 Testing market_indicators_cache table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('market_indicators_cache')
      .select('*')
      .limit(5);
      
    console.log('Market indicators cache test result:', { data: tableTest, error: tableError });

    const cacheStatus = tableError ? 'failed' : 'ok';

    // Count available indicators
    const { data: countData, error: countError } = await supabase
      .from('market_indicators_cache')
      .select('indicator_type', { count: 'exact' })
      .eq('is_active', true);

    return {
      status: 'healthy',
      details: {
        database: 'connected',
        cacheFunction: cacheStatus,
        availableIndicators: countError ? 0 : (countData?.length || 0),
        configLoaded: testData ? testData.length > 0 : false,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
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
      const overview = await getMarketOverview();

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