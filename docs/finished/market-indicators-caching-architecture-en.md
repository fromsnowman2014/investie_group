# Market Indicators Data Caching Architecture Implementation Plan

## 1. Project Overview

### Current Situation Analysis
- **Current Operation**: Real-time Alpha Vantage API calls when users access the webpage
- **Issues**:
  - API rate limit of 25 calls/day
  - Increased page loading time (real-time API calls)
  - API limits reached when concurrent users increase
  - Poor user experience due to non-cached data

### Target Architecture
- **New Operation**: Periodic data collection → Supabase DB storage → Webpage DB queries
- **Improvement Benefits**:
  - Optimized API usage (only 2 calls per day)
  - Improved page loading speed
  - Stable data provision
  - Scalable architecture

## 2. Architecture Design

### 2.1 Data Flow
```
[External APIs] → [Supabase Edge Function: data-collector] → [Supabase DB] → [Frontend: SWR Cache] → [Users]
     ↓                          ↓                            ↓                    ↓
1. Alpha Vantage         2. Scheduled data collection       3. Cached data        4. Fast loading
   FRED API                (twice daily)                    storage               (DB queries)
   Yahoo Finance
   Alternative.me
```

### 2.2 Core Components

#### A. Data Collector (Supabase Edge Function: `data-collector`)
- **Role**: Collect data from external APIs and store in DB
- **Execution Methods**:
  - Manual trigger (development/testing)
  - GitHub Actions cron job (production: twice daily)
  - Vercel Cron Functions (backup option)

#### B. Database Schema (Supabase PostgreSQL)
```sql
-- Market indicators cache table
market_indicators_cache (
  id, indicator_type, data_value, metadata,
  data_source, created_at, expires_at
)

-- Stock data cache table (existing)
stock_data (
  symbol, price, change_amount, change_percent,
  market_cap, volume, data_source, created_at
)

-- Economic indicators cache table
economic_indicators (
  indicator_name, current_value, previous_value,
  change_percent, trend, data_source, created_at
)
```

#### C. Data Reader (Supabase Edge Function: `database-reader`)
- **Role**: Query cached data and provide to frontend
- **Features**:
  - **Smart Cache Queries**: Prioritize cached data from Supabase DB during webpage loading
  - **Data Freshness Validation**: Configurable threshold (default 12 hours) - immediately load data updated within threshold
  - **Auto-refresh**: Detect stale data beyond threshold and update DB via background API calls, then provide latest data
  - **Multi-layer Fallback**: Cache failure → Real-time API call → Static data sequential processing
  - **Configurable Parameters**: Data expiration time, API call strategy, retry logic managed via environment variables

#### D. Frontend Optimization
- **Modified SWR Caching Strategy**: Change to DB queries
- **Real-time Updates**: WebSocket/Real-time subscription (optional)
- **Error Handling**: Graceful fallback when cache fails

## 3. Implementation Phase Plan

### Phase 1: Database Schema Extension (1-2 days)

#### 1.1 Create New Migration
```bash
supabase migration new create_market_indicators_cache
```

#### 1.2 Market Indicators Dedicated Table Design
```sql
-- 002_create_market_indicators_cache.sql
CREATE TABLE market_indicators_cache (
  id BIGSERIAL PRIMARY KEY,
  indicator_type VARCHAR(50) NOT NULL, -- 'fear_greed', 'vix', 'treasury_10y', 'cpi', 'unemployment'
  data_value JSONB NOT NULL,          -- Actual data (flexible structure)
  metadata JSONB DEFAULT '{}',        -- Additional metadata
  data_source VARCHAR(50) NOT NULL,   -- 'alpha_vantage', 'fred', 'alternative_me'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,             -- Data expiration time
  is_active BOOLEAN DEFAULT true      -- Soft delete support
);

-- Performance optimization indexes
CREATE INDEX idx_market_indicators_type_active ON market_indicators_cache(indicator_type, is_active, created_at DESC);
CREATE INDEX idx_market_indicators_expires ON market_indicators_cache(expires_at) WHERE is_active = true;
```

#### 1.3 Existing Table Optimization
```sql
-- Add caching-related columns to market_overview table
ALTER TABLE market_overview ADD COLUMN cache_strategy VARCHAR(20) DEFAULT 'realtime';
ALTER TABLE market_overview ADD COLUMN cache_expires_at TIMESTAMPTZ;
ALTER TABLE market_overview ADD COLUMN cache_max_age_hours INTEGER DEFAULT 12;

-- Add configuration table (runtime configuration management)
CREATE TABLE cache_config (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO cache_config (config_key, config_value, description) VALUES
('cache_max_age_hours', '12', 'Maximum cache data validity time (hours)'),
('cache_stale_hours', '6', 'Stale-while-revalidate threshold (hours)'),
('api_retry_attempts', '3', 'API call retry count'),
('cache_fallback_enabled', 'true', 'Enable API fallback on cache failure'),
('realtime_only_mode', 'false', 'Emergency real-time only mode'),
('refresh_interval_minutes', '5', 'SWR refresh interval (minutes)');
```

### Phase 2: Data Collector Enhancement (2-3 days)

#### 2.1 `data-collector` Edge Function Extension
```typescript
// New functionality additions
interface MarketIndicatorCollectionJob {
  indicators: IndicatorType[];
  frequency: 'hourly' | 'daily' | 'weekly';
  retryConfig: RetryConfig;
  cacheConfig: CacheConfig;
}

// Define indicator types to collect
enum IndicatorType {
  FEAR_GREED_INDEX = 'fear_greed',
  VIX_VOLATILITY = 'vix',
  TREASURY_10Y = 'treasury_10y',
  CPI_INFLATION = 'cpi',
  UNEMPLOYMENT = 'unemployment',
  SP500_INDEX = 'sp500',
  NASDAQ_INDEX = 'nasdaq',
  SECTOR_PERFORMANCE = 'sectors'
}
```

#### 2.2 Batch Collection Logic Implementation
```typescript
async function collectAllMarketIndicators(): Promise<CollectionResult> {
  const results = [];

  // 1. Collect economic indicators (FRED API)
  const economicIndicators = await collectEconomicIndicators();
  results.push(...economicIndicators);

  // 2. Collect market indicators (Alpha Vantage, Yahoo Finance)
  const marketIndicators = await collectMarketIndicators();
  results.push(...marketIndicators);

  // 3. Collect sentiment indicators (Alternative.me)
  const sentimentIndicators = await collectSentimentIndicators();
  results.push(...sentimentIndicators);

  // 4. Batch save to database
  await saveToDatabase(results);

  return { success: true, collected: results.length };
}
```

### Phase 3: Scheduling System Implementation (1-2 days)

#### 3.1 GitHub Actions Workflow
```yaml
# .github/workflows/data-collection.yml
name: Market Data Collection
on:
  schedule:
    - cron: '0 9,16 * * 1-5'  # Mon-Fri 9:00, 16:00 UTC (EST 5:00, 12:00)
  workflow_dispatch:  # Manual execution support

jobs:
  collect-data:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Data Collection
        run: |
          curl -X POST "${{ secrets.SUPABASE_FUNCTIONS_URL }}/data-collector" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"action": "collect_all", "source": "github_actions"}'
```

#### 3.2 Vercel Cron Functions (Backup)
```typescript
// pages/api/cron/collect-market-data.ts
export default async function handler(req: NextRequest) {
  // Verify Vercel Cron Secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Call Supabase Edge Function
  const response = await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/data-collector`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'collect_all', source: 'vercel_cron' })
  });

  return Response.json({ success: true, status: response.status });
}
```

### Phase 4: Data Query Optimization (2 days)

#### 4.1 `database-reader` Edge Function Enhancement
```typescript
// Configuration values managed by environment variables
interface CacheConfig {
  maxAge: number;           // Default 12 hours (43200 seconds)
  staleWhileRevalidate: number;  // Background refresh allowance time
  retryAttempts: number;    // API call retry count
  fallbackEnabled: boolean; // Fallback activation
}

interface CachedDataQuery {
  indicatorType: IndicatorType;
  maxAge?: number;          // Override configuration values
  fallbackToAPI?: boolean;  // Real-time API call on cache failure
  forceRefresh?: boolean;   // Force refresh request
}

// Load configuration values from environment variables
function loadCacheConfig(): CacheConfig {
  return {
    maxAge: parseInt(Deno.env.get('CACHE_MAX_AGE_HOURS') || '12') * 3600,
    staleWhileRevalidate: parseInt(Deno.env.get('CACHE_STALE_HOURS') || '6') * 3600,
    retryAttempts: parseInt(Deno.env.get('API_RETRY_ATTEMPTS') || '3'),
    fallbackEnabled: Deno.env.get('CACHE_FALLBACK_ENABLED') !== 'false'
  };
}

async function getCachedMarketData(query: CachedDataQuery): Promise<MarketData> {
  const config = loadCacheConfig();
  const maxAge = query.maxAge || config.maxAge;

  // 1. Query latest data from cache
  const cachedData = await queryFromCache(query);

  // 2. Handle force refresh request
  if (query.forceRefresh) {
    return await refreshAndReturnData(query, config);
  }

  // 3. Data freshness validation
  if (cachedData && isDataFresh(cachedData, maxAge)) {
    console.log(`✅ Fresh cache hit for ${query.indicatorType} (${getDataAge(cachedData)}s old)`);
    return cachedData;
  }

  // 4. Stale-While-Revalidate pattern
  if (cachedData && isDataStale(cachedData, maxAge, config.staleWhileRevalidate)) {
    console.log(`🔄 Serving stale data while revalidating ${query.indicatorType}`);
    // Background data refresh (asynchronous)
    revalidateDataInBackground(query, config);
    return cachedData;
  }

  // 5. Cache miss or very stale data - immediate refresh needed
  if (query.fallbackToAPI && config.fallbackEnabled) {
    console.log(`🔧 Cache miss/expired for ${query.indicatorType} - fetching fresh data`);
    return await refreshAndReturnData(query, config);
  }

  // 6. Last resort: return most recent cached data
  console.warn(`⚠️ Returning stale cache data for ${query.indicatorType}`);
  return getLatestCachedData(query.indicatorType);
}

async function refreshAndReturnData(query: CachedDataQuery, config: CacheConfig): Promise<MarketData> {
  try {
    const realTimeData = await fetchFromAPIWithRetry(query.indicatorType, config.retryAttempts);

    // Immediate cache update
    await updateCacheImmediate(realTimeData);

    console.log(`✅ Fresh data fetched and cached for ${query.indicatorType}`);
    return realTimeData;
  } catch (error) {
    console.error(`❌ Failed to fetch fresh data for ${query.indicatorType}:`, error.message);

    // Return recent cached data even on API failure
    return getLatestCachedData(query.indicatorType);
  }
}

// Background refresh (fire-and-forget)
async function revalidateDataInBackground(query: CachedDataQuery, config: CacheConfig): Promise<void> {
  // Execute as background task (don't wait for Promise)
  setTimeout(async () => {
    try {
      const freshData = await fetchFromAPIWithRetry(query.indicatorType, config.retryAttempts);
      await updateCacheImmediate(freshData);
      console.log(`🔄 Background revalidation completed for ${query.indicatorType}`);
    } catch (error) {
      console.error(`❌ Background revalidation failed for ${query.indicatorType}:`, error.message);
    }
  }, 0);
}

// Data freshness validation functions
function isDataFresh(data: any, maxAge: number): boolean {
  const age = getDataAge(data);
  return age < maxAge;
}

function isDataStale(data: any, maxAge: number, staleThreshold: number): boolean {
  const age = getDataAge(data);
  return age >= maxAge && age < (maxAge + staleThreshold);
}

function getDataAge(data: any): number {
  const createdAt = new Date(data.created_at || data.lastUpdated);
  return Math.floor((Date.now() - createdAt.getTime()) / 1000);
}
```

#### 4.2 Frontend Hook Modification
```typescript
// hooks/useCachedMarketData.ts
interface CachedMarketDataConfig {
  maxAge?: number;          // Cache maximum age (seconds)
  refreshInterval?: number; // SWR refresh interval (milliseconds)
  forceRefresh?: boolean;   // Force refresh
}

export const useCachedMarketData = (config: CachedMarketDataConfig = {}) => {
  // Default settings (environment variable based)
  const defaultMaxAge = parseInt(process.env.NEXT_PUBLIC_CACHE_MAX_AGE_HOURS || '12') * 3600;
  const defaultRefreshInterval = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES || '5') * 60000;

  const { data, error, isLoading, mutate } = useSWR(
    ['cached-market-overview', config.maxAge, config.forceRefresh],
    () => edgeFunctionFetcher('database-reader', {
      action: 'get_market_overview',
      maxAge: config.maxAge || defaultMaxAge,
      fallbackToAPI: true,
      forceRefresh: config.forceRefresh || false
    }),
    {
      refreshInterval: config.refreshInterval || defaultRefreshInterval,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      dedupingInterval: 60000,  // 1 minute deduplication
      // Maintain existing data on error
      errorRetryInterval: 30000,
      shouldRetryOnError: (error) => {
        // Only retry network errors
        return !error?.message?.includes('404');
      }
    }
  );

  // Force refresh function
  const forceRefresh = async () => {
    return await mutate(
      edgeFunctionFetcher('database-reader', {
        action: 'get_market_overview',
        maxAge: 0,  // Force new data
        fallbackToAPI: true,
        forceRefresh: true
      }),
      { revalidate: false }
    );
  };

  // Data freshness calculation
  const getDataFreshness = () => {
    if (!data?.lastUpdated) return null;

    const lastUpdated = new Date(data.lastUpdated);
    const ageInSeconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    const maxAge = config.maxAge || defaultMaxAge;

    return {
      ageInSeconds,
      ageInHours: Math.floor(ageInSeconds / 3600),
      freshness: Math.max(0, 100 - (ageInSeconds / maxAge) * 100),
      isStale: ageInSeconds > maxAge
    };
  };

  return {
    marketData: data,
    isLoading,
    error,
    isCacheData: data?.source === 'cache',
    isRealtimeData: data?.source === 'realtime',
    lastUpdated: data?.lastUpdated,
    freshness: getDataFreshness(),
    forceRefresh,
    // Cache status information
    cacheInfo: {
      maxAge: config.maxAge || defaultMaxAge,
      refreshInterval: config.refreshInterval || defaultRefreshInterval,
      source: data?.source || 'unknown'
    }
  };
};
```

### Phase 5: Monitoring & Alert System (1 day)

#### 5.1 Data Quality Monitoring
```typescript
// Data collection success rate tracking
interface DataQualityMetrics {
  collection_success_rate: number;
  api_error_count: number;
  cache_hit_rate: number;
  data_freshness_avg: number;  // Average data freshness (minutes)
}

// Alert trigger conditions
const ALERT_THRESHOLDS = {
  collection_failure_rate: 0.2,  // 20% or more failures
  data_staleness_hours: 6,       // 6+ hour old data
  api_error_consecutive: 3       // 3 consecutive API errors
};
```

#### 5.2 Slack Alert Integration
```typescript
async function sendAlertToSlack(alert: AlertData) {
  const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Market Data Alert: ${alert.type}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Issue:* ${alert.message}\n*Timestamp:* ${alert.timestamp}\n*Severity:* ${alert.severity}`
          }
        }
      ]
    })
  });
}
```

## 4. TDD Approach and Validation Strategy

### 4.1 Test Pyramid Structure

#### Unit Tests (70%)
```typescript
// tests/unit/data-collector.test.ts
describe('MarketDataCollector', () => {
  describe('collectEconomicIndicators', () => {
    it('should fetch and parse FRED API data correctly', async () => {
      // Mock FRED API response
      const mockResponse = { observations: [{ value: '4.25', date: '2025-09-18' }] };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      const result = await collectEconomicIndicators(['DGS10']);

      expect(result).toEqual([{
        indicator_type: 'treasury_10y',
        data_value: { value: 4.25, date: '2025-09-18' },
        data_source: 'fred'
      }]);
    });

    it('should handle API rate limits gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const result = await collectEconomicIndicators(['DGS10']);

      expect(result).toEqual([]);
      expect(loggerMock).toHaveBeenCalledWith('Rate limit hit for FRED API');
    });
  });
});
```

#### Integration Tests (20%)
```typescript
// tests/integration/database-operations.test.ts
describe('Database Operations', () => {
  let supabase: SupabaseClient;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    await cleanupTestData();
  });

  it('should save and retrieve market indicators correctly', async () => {
    const testData = {
      indicator_type: 'fear_greed',
      data_value: { value: 75, status: 'greed' },
      data_source: 'alternative_me'
    };

    // Save to database
    await saveMarketIndicator(supabase, testData);

    // Retrieve from database
    const retrieved = await getLatestMarketIndicator(supabase, 'fear_greed');

    expect(retrieved.data_value).toEqual(testData.data_value);
    expect(retrieved.data_source).toBe('alternative_me');
  });

  it('should handle database connection failures', async () => {
    const invalidSupabase = createSupabaseClient('invalid-url', 'invalid-key');

    await expect(saveMarketIndicator(invalidSupabase, testData))
      .rejects.toThrow('Database connection failed');
  });
});
```

#### E2E Tests (10%)
```typescript
// tests/e2e/market-data-flow.test.ts
describe('Market Data End-to-End Flow', () => {
  it('should collect data and serve it to frontend', async () => {
    // 1. Trigger data collection
    const collectionResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/data-collector`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ action: 'collect_all' })
    });

    expect(collectionResponse.ok).toBe(true);

    // 2. Wait for data to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 3. Verify data is available via database-reader
    const dataResponse = await fetch(`${SUPABASE_FUNCTIONS_URL}/database-reader`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ action: 'get_market_overview' })
    });

    const data = await dataResponse.json();
    expect(data).toHaveProperty('fearGreedIndex');
    expect(data).toHaveProperty('economicIndicators');
    expect(data.source).toBe('cache');
  });
});
```

### 4.2 Database Validation Strategy

#### A. Schema Tests
```sql
-- tests/schema/validate_market_indicators.sql
DO $$
BEGIN
  -- Check table existence
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'market_indicators_cache'
  )), 'market_indicators_cache table must exist';

  -- Check required columns
  ASSERT (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'market_indicators_cache'
    AND column_name IN ('indicator_type', 'data_value', 'data_source')
  ) = 3, 'Required columns must exist';

  -- Check indexes
  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'market_indicators_cache'
    AND indexname = 'idx_market_indicators_type_active'
  )), 'Performance index must exist';
END $$;
```

#### B. Data Integrity Tests
```typescript
// tests/database/data-integrity.test.ts
describe('Data Integrity', () => {
  it('should maintain referential integrity', async () => {
    // Test foreign key constraints
    await expect(insertInvalidReference()).rejects.toThrow();
  });

  it('should enforce data validation rules', async () => {
    // Test CHECK constraints
    await expect(insertDataWithInvalidEnum()).rejects.toThrow();
  });

  it('should handle concurrent writes correctly', async () => {
    // Test race conditions
    const promises = Array(10).fill(null).map(() =>
      saveMarketIndicator({ indicator_type: 'fear_greed', /* ... */ })
    );

    await Promise.all(promises);

    const count = await countMarketIndicators('fear_greed');
    expect(count).toBe(10);
  });
});
```

### 4.3 Performance Tests

#### A. Load Tests
```typescript
// tests/performance/load-test.ts
describe('Performance Tests', () => {
  it('should handle high concurrent requests', async () => {
    const startTime = Date.now();

    // Simulate 100 concurrent requests
    const promises = Array(100).fill(null).map(() =>
      fetch(`${FUNCTIONS_URL}/database-reader`, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_market_overview' })
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    expect(responses.every(r => r.ok)).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000);  // Within 5 seconds
  });
});
```

#### B. Cache Hit Rate Tests
```typescript
describe('Cache Performance', () => {
  it('should achieve >90% cache hit rate under normal load', async () => {
    const requests = 100;
    let cacheHits = 0;

    for (let i = 0; i < requests; i++) {
      const response = await getCachedMarketData({ indicatorType: 'fear_greed' });
      if (response.source === 'cache') cacheHits++;
    }

    const hitRate = cacheHits / requests;
    expect(hitRate).toBeGreaterThan(0.9);
  });
});
```

## 5. Deployment and Monitoring

### 5.1 Phased Deployment Strategy

#### Stage 1: Development (Local)
```bash
# Local environment setup
supabase start
supabase db reset
supabase functions serve

# Run tests
npm run test:unit
npm run test:integration
```

#### Stage 2: Staging (Supabase Preview)
```bash
# Preview environment deployment
supabase link --project-ref staging-project
supabase db push
supabase functions deploy

# Staging tests
npm run test:e2e:staging
```

#### Stage 3: Production (Blue-Green Deployment)
```bash
# Production deployment (zero downtime)
supabase functions deploy --project-ref production
# Gradual traffic switching: 10% → 50% → 100%
```

### 5.2 Monitoring Dashboard

#### A. Key Metrics
- **Data Freshness**: Age of recently collected data
- **API Success Rate**: External API call success ratio
- **Cache Hit Rate**: Requests served from DB ratio
- **Response Time**: Average/95th percentile response time
- **Error Rate**: 4xx/5xx error ratio

#### B. Alert Rules
```typescript
const MONITORING_RULES = {
  data_staleness: {
    threshold: '6 hours',
    severity: 'WARNING',
    action: 'retry_collection'
  },
  api_failure_rate: {
    threshold: 0.2,  // 20%
    severity: 'CRITICAL',
    action: 'activate_fallback'
  },
  cache_hit_rate: {
    threshold: 0.8,  // Below 80%
    severity: 'INFO',
    action: 'investigate_cache'
  }
};
```

## 6. Migration Plan

### 6.1 Gradual Transition Strategy

#### Week 1: Infrastructure Setup
- [ ] Deploy database schema
- [ ] Implement and test data collector
- [ ] Verify manual data collection

#### Week 2: Automation Implementation
- [ ] Set up GitHub Actions workflow
- [ ] Test and verify scheduling
- [ ] Build monitoring system

#### Week 3: Hybrid Operation
- [ ] Frontend queries both DB + API
- [ ] Monitor cache hit rate
- [ ] Compare performance analysis

#### Week 4: Complete Transition
- [ ] Remove real-time API calls
- [ ] DB-only data sourcing
- [ ] Final performance verification

### 6.2 Rollback Plan
```typescript
// Emergency rollback with feature flags and configuration values
interface FeatureFlags {
  useCachedData: boolean;       // Use cached data
  maxCacheAge: number;          // Cache maximum age (hours)
  fallbackEnabled: boolean;     // Enable fallback
  realtimeOnlyMode: boolean;    // Real-time only mode
}

function loadFeatureFlags(): FeatureFlags {
  return {
    useCachedData: Deno.env.get('USE_CACHED_DATA') !== 'false',
    maxCacheAge: parseInt(Deno.env.get('CACHE_MAX_AGE_HOURS') || '12'),
    fallbackEnabled: Deno.env.get('CACHE_FALLBACK_ENABLED') !== 'false',
    realtimeOnlyMode: Deno.env.get('REALTIME_ONLY_MODE') === 'true'
  };
}

async function getMarketData(indicatorType: string) {
  const flags = loadFeatureFlags();

  // Emergency rollback: real-time only mode
  if (flags.realtimeOnlyMode) {
    console.log('🚨 Emergency mode: Using realtime API only');
    return await getRealTimeMarketData(indicatorType);
  }

  // Normal cache usage
  if (flags.useCachedData) {
    return await getCachedMarketData({
      indicatorType,
      maxAge: flags.maxCacheAge * 3600,
      fallbackToAPI: flags.fallbackEnabled
    });
  } else {
    // Cache disabled - use existing method
    console.log('📡 Cache disabled: Using realtime API');
    return await getRealTimeMarketData(indicatorType);
  }
}
```

## 7. Success Metrics (KPIs)

### 7.1 Technical KPIs
- **Page Loading Time**: 3 seconds → Under 1 second
- **API Usage**: 100+ calls/day → 50 calls/day
- **Cache Hit Rate**: 0% → 95%+
- **System Availability**: 99.5% → 99.9%

### 7.2 Business KPIs
- **User Bounce Rate**: 20% reduction target
- **Page Dwell Time**: 30% increase target
- **API Costs**: 50% reduction target
- **Scalability**: Support for 1000+ concurrent users

## 8. Risk Management

### 8.1 Major Risk Factors
1. **Data Collection Failure**: API outages, network issues
2. **Scheduling Failure**: GitHub Actions, Vercel Cron outages
3. **Database Outage**: Supabase DB downtime
4. **Data Inconsistency**: Real-time vs cached data differences

### 8.2 Mitigation Strategies
```typescript
// Multi-layer fallback system
async function getMarketDataWithFallback() {
  try {
    // Primary: cached data
    return await getCachedData();
  } catch (error) {
    console.warn('Cache failed, trying real-time API');

    try {
      // Secondary: real-time API
      return await getRealTimeData();
    } catch (error) {
      console.error('Real-time API failed, using static fallback');

      // Tertiary: static fallback data
      return getStaticFallbackData();
    }
  }
}
```

## 9. Conclusion

This architecture enables transition from current real-time API calls to a cache-based system, achieving:

1. **Performance Improvement**: Dramatically reduced page loading times
2. **Cost Optimization**: 50% reduction in API usage
3. **Enhanced Stability**: Reduced external API dependencies
4. **Scalability**: Architecture capable of handling user growth

Through TDD approach with phase-by-phase validation and gradual migration to minimize risks, we can safely transition to the new architecture.