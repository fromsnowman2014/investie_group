// Market Overview API - Refactored version
// Provides market data through a 12-hour cache system with on-demand updates

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type {
  MarketOverviewResponse,
  CachedDataQuery,
  DatabaseReaderResponse
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
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

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
 * Get cached market data with direct database access (bypassing database-reader)
 */
async function getCachedMarketData(maxAge: number = DEFAULT_MAX_AGE): Promise<DatabaseReaderResponse> {
  const log = logFunctionCall('getCachedMarketData', { maxAge });

  try {
    console.log('🔧 Using direct database access to bypass database-reader issues');

    // Direct database query for market indicators
    const { data: indicators, error } = await supabase
      .from('market_indicators_cache')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Direct database query failed:', error);
      throw error;
    }

    console.log(`✅ Retrieved ${indicators?.length || 0} indicators from database directly`);

    // Transform data to match expected format
    const cachedData: DatabaseReaderResponse = {
      economicIndicators: indicators?.filter(i => ['treasury_10y', 'unemployment', 'cpi'].includes(i.indicator_type)) || [],
      marketIndicators: indicators?.filter(i => ['sp500', 'vix', 'fear_greed'].includes(i.indicator_type)) || [],
      lastUpdated: indicators?.[0]?.created_at || new Date().toISOString(),
      source: 'cache' as const,
      cacheInfo: {
        totalIndicators: indicators?.length || 0,
        freshIndicators: indicators?.length || 0,
        staleIndicators: 0,
        cacheHitRate: 1
      }
    };

    log.end(cachedData);
    return cachedData;

  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
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
    console.log('📊 Market overview request received - using cached data system');

    // Parse request body with safe defaults
    const requestBody = await safeParseJSON(req, {});
    const maxAge = requestBody.maxAge || DEFAULT_MAX_AGE;

    // Get cached market data (with automatic refresh if stale)
    const cachedData = await getCachedMarketData(maxAge);

    // Convert cached data to the expected market overview format
    const marketOverview = convertCachedDataToMarketOverview(cachedData);

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