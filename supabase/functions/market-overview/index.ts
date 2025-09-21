// Market Overview API - Refactored version
// Provides market data through a 12-hour cache system with on-demand updates

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
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

/**
 * Configuration constants
 */
const DEFAULT_MAX_AGE = 43200; // 12 hours in seconds
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300' // Cache for 5 minutes on client side
};

/**
 * Get cached market data with automatic refresh logic
 */
async function getCachedMarketData(maxAge: number = DEFAULT_MAX_AGE): Promise<DatabaseReaderResponse> {
  const log = logFunctionCall('getCachedMarketData', { maxAge });

  try {
    const requestBody: CachedDataQuery = {
      action: 'get_market_overview',
      maxAge,
      fallbackToAPI: true
    };

    const cachedData = await callInternalFunction<DatabaseReaderResponse>(
      'database-reader',
      requestBody
    );

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