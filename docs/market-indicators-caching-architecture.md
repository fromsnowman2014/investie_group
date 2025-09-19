# Market Indicators 데이터 캐싱 아키텍처 구현 계획

## 1. 프로젝트 개요

### 현재 상황 분석
- **기존 동작**: 유저가 웹페이지 접속 시 실시간으로 Alpha Vantage API 호출
- **문제점**:
  - API rate limit 25 calls/day 제한
  - 페이지 로딩 시간 증가 (실시간 API 호출)
  - 동시 접속자 증가 시 API 한계 도달
  - 캐시되지 않는 데이터로 인한 사용자 경험 저하

### 목표 아키텍처
- **새로운 동작**: 주기적으로 데이터 수집 → Supabase DB 저장 → 웹페이지에서 DB 조회
- **개선 효과**:
  - API 사용량 최적화 (하루 2회만 호출). 
  - 페이지 로딩 속도 향상
  - 안정적인 데이터 제공
  - 확장 가능한 아키텍처

## 2. 아키텍처 설계

### 2.1 데이터 플로우
```
[외부 APIs] → [Supabase Edge Function: data-collector] → [Supabase DB] → [Frontend: SWR Cache] → [사용자]
     ↓                          ↓                            ↓                    ↓
1. Alpha Vantage         2. 스케줄링된 데이터 수집        3. 캐시된 데이터        4. 빠른 로딩
   FRED API                (하루 2회)                    저장                  (DB 조회)
   Yahoo Finance
   Alternative.me
```

### 2.2 핵심 컴포넌트

#### A. 데이터 수집기 (Supabase Edge Function: `data-collector`)
- **역할**: 외부 API에서 데이터 수집하여 DB 저장
- **실행 방식**:
  - Manual trigger (개발/테스트용)
  - GitHub Actions cron job (프로덕션용: 하루 2회)
  - Vercel Cron Functions (백업 옵션)

#### B. 데이터베이스 스키마 (Supabase PostgreSQL)
```sql
-- 시장 지표 캐시 테이블
market_indicators_cache (
  id, indicator_type, data_value, metadata,
  data_source, created_at, expires_at
)

-- 주식 데이터 캐시 테이블 (기존)
stock_data (
  symbol, price, change_amount, change_percent,
  market_cap, volume, data_source, created_at
)

-- 경제 지표 캐시 테이블
economic_indicators (
  indicator_name, current_value, previous_value,
  change_percent, trend, data_source, created_at
)
```

#### C. 데이터 조회기 (Supabase Edge Function: `database-reader`)
- **역할**: 캐시된 데이터를 조회하여 프론트엔드에 제공
- **기능**:
  - **스마트 캐시 조회**: 웹페이지 로딩 시 Supabase DB에서 캐시된 데이터 우선 조회
  - **데이터 신선도 검증**: 설정 가능한 임계값(기본 12시간) 내 업데이트된 데이터는 즉시 로딩
  - **자동 갱신**: 임계값을 초과한 오래된 데이터 감지 시 백그라운드에서 API 호출하여 DB 업데이트 후 최신 데이터 제공
  - **다층 Fallback**: 캐시 실패 → 실시간 API 호출 → 정적 데이터 순차 처리
  - **설정 가능한 파라미터**: 데이터 만료 시간, API 호출 전략, 재시도 로직 등 환경변수로 관리

#### D. 프론트엔드 최적화
- **SWR 캐싱 전략 수정**: DB 조회로 변경
- **실시간 업데이트**: WebSocket/Real-time 구독 (선택사항)
- **오류 처리**: 캐시 실패 시 graceful fallback

## 3. 구현 단계별 계획

### Phase 1: 데이터베이스 스키마 확장 (1-2일)

#### 1.1 새로운 마이그레이션 생성
```bash
supabase migration new create_market_indicators_cache
```

#### 1.2 Market Indicators 전용 테이블 설계
```sql
-- 002_create_market_indicators_cache.sql
CREATE TABLE market_indicators_cache (
  id BIGSERIAL PRIMARY KEY,
  indicator_type VARCHAR(50) NOT NULL, -- 'fear_greed', 'vix', 'treasury_10y', 'cpi', 'unemployment'
  data_value JSONB NOT NULL,          -- 실제 데이터 (유연한 구조)
  metadata JSONB DEFAULT '{}',        -- 추가 메타데이터
  data_source VARCHAR(50) NOT NULL,   -- 'alpha_vantage', 'fred', 'alternative_me'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,             -- 데이터 만료 시간
  is_active BOOLEAN DEFAULT true      -- soft delete 지원
);

-- 성능 최적화 인덱스
CREATE INDEX idx_market_indicators_type_active ON market_indicators_cache(indicator_type, is_active, created_at DESC);
CREATE INDEX idx_market_indicators_expires ON market_indicators_cache(expires_at) WHERE is_active = true;
```

#### 1.3 기존 테이블 최적화
```sql
-- market_overview 테이블에 캐싱 관련 컬럼 추가
ALTER TABLE market_overview ADD COLUMN cache_strategy VARCHAR(20) DEFAULT 'realtime';
ALTER TABLE market_overview ADD COLUMN cache_expires_at TIMESTAMPTZ;
ALTER TABLE market_overview ADD COLUMN cache_max_age_hours INTEGER DEFAULT 12;

-- 설정 테이블 추가 (런타임 설정 관리)
CREATE TABLE cache_config (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 설정값 삽입
INSERT INTO cache_config (config_key, config_value, description) VALUES
('cache_max_age_hours', '12', '캐시 데이터 최대 유효 시간 (시간)'),
('cache_stale_hours', '6', 'Stale-while-revalidate 임계값 (시간)'),
('api_retry_attempts', '3', 'API 호출 재시도 횟수'),
('cache_fallback_enabled', 'true', '캐시 실패 시 API fallback 활성화'),
('realtime_only_mode', 'false', '긴급 시 실시간 전용 모드'),
('refresh_interval_minutes', '5', 'SWR 갱신 간격 (분)');
```

### Phase 2: 데이터 수집기 강화 (2-3일)

#### 2.1 `data-collector` Edge Function 확장
```typescript
// 새로운 기능 추가
interface MarketIndicatorCollectionJob {
  indicators: IndicatorType[];
  frequency: 'hourly' | 'daily' | 'weekly';
  retryConfig: RetryConfig;
  cacheConfig: CacheConfig;
}

// 수집할 지표 타입 정의
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

#### 2.2 배치 수집 로직 구현
```typescript
async function collectAllMarketIndicators(): Promise<CollectionResult> {
  const results = [];

  // 1. 경제 지표 수집 (FRED API)
  const economicIndicators = await collectEconomicIndicators();
  results.push(...economicIndicators);

  // 2. 시장 지표 수집 (Alpha Vantage, Yahoo Finance)
  const marketIndicators = await collectMarketIndicators();
  results.push(...marketIndicators);

  // 3. 심리 지표 수집 (Alternative.me)
  const sentimentIndicators = await collectSentimentIndicators();
  results.push(...sentimentIndicators);

  // 4. 데이터베이스에 일괄 저장
  await saveToDatabase(results);

  return { success: true, collected: results.length };
}
```

### Phase 3: 스케줄링 시스템 구현 (1-2일)

#### 3.1 GitHub Actions Workflow
```yaml
# .github/workflows/data-collection.yml
name: Market Data Collection
on:
  schedule:
    - cron: '0 9,16 * * 1-5'  # 월-금 9:00, 16:00 UTC (EST 5:00, 12:00)
  workflow_dispatch:  # 수동 실행 지원

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

#### 3.2 Vercel Cron Functions (백업)
```typescript
// pages/api/cron/collect-market-data.ts
export default async function handler(req: NextRequest) {
  // Vercel Cron Secret 검증
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Supabase Edge Function 호출
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

### Phase 4: 데이터 조회 최적화 (2일)

#### 4.1 `database-reader` Edge Function 개선
```typescript
// 환경변수로 관리되는 설정값들
interface CacheConfig {
  maxAge: number;           // 기본 12시간 (43200초)
  staleWhileRevalidate: number;  // 백그라운드 갱신 허용 시간
  retryAttempts: number;    // API 호출 재시도 횟수
  fallbackEnabled: boolean; // Fallback 활성화 여부
}

interface CachedDataQuery {
  indicatorType: IndicatorType;
  maxAge?: number;          // 설정값 오버라이드 가능
  fallbackToAPI?: boolean;  // 캐시 실패 시 실시간 API 호출 여부
  forceRefresh?: boolean;   // 강제 갱신 요청
}

// 환경변수에서 설정값 로드
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

  // 1. 캐시에서 최신 데이터 조회
  const cachedData = await queryFromCache(query);

  // 2. 강제 갱신 요청 처리
  if (query.forceRefresh) {
    return await refreshAndReturnData(query, config);
  }

  // 3. 데이터 신선도 검증
  if (cachedData && isDataFresh(cachedData, maxAge)) {
    console.log(`✅ Fresh cache hit for ${query.indicatorType} (${getDataAge(cachedData)}s old)`);
    return cachedData;
  }

  // 4. Stale-While-Revalidate 패턴
  if (cachedData && isDataStale(cachedData, maxAge, config.staleWhileRevalidate)) {
    console.log(`🔄 Serving stale data while revalidating ${query.indicatorType}`);
    // 백그라운드에서 데이터 갱신 (비동기)
    revalidateDataInBackground(query, config);
    return cachedData;
  }

  // 5. 캐시 미스 또는 매우 오래된 데이터 - 즉시 갱신 필요
  if (query.fallbackToAPI && config.fallbackEnabled) {
    console.log(`🔧 Cache miss/expired for ${query.indicatorType} - fetching fresh data`);
    return await refreshAndReturnData(query, config);
  }

  // 6. 최후의 수단: 가장 최근 캐시 데이터 반환
  console.warn(`⚠️ Returning stale cache data for ${query.indicatorType}`);
  return getLatestCachedData(query.indicatorType);
}

async function refreshAndReturnData(query: CachedDataQuery, config: CacheConfig): Promise<MarketData> {
  try {
    const realTimeData = await fetchFromAPIWithRetry(query.indicatorType, config.retryAttempts);

    // 즉시 캐시 업데이트
    await updateCacheImmediate(realTimeData);

    console.log(`✅ Fresh data fetched and cached for ${query.indicatorType}`);
    return realTimeData;
  } catch (error) {
    console.error(`❌ Failed to fetch fresh data for ${query.indicatorType}:`, error.message);

    // API 실패 시 최근 캐시 데이터라도 반환
    return getLatestCachedData(query.indicatorType);
  }
}

// 백그라운드 갱신 (fire-and-forget)
async function revalidateDataInBackground(query: CachedDataQuery, config: CacheConfig): Promise<void> {
  // 백그라운드 작업으로 실행 (Promise를 기다리지 않음)
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

// 데이터 신선도 검증 함수들
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

#### 4.2 프론트엔드 Hook 수정
```typescript
// hooks/useCachedMarketData.ts
interface CachedMarketDataConfig {
  maxAge?: number;          // 캐시 최대 나이 (초)
  refreshInterval?: number; // SWR 갱신 간격 (밀리초)
  forceRefresh?: boolean;   // 강제 갱신
}

export const useCachedMarketData = (config: CachedMarketDataConfig = {}) => {
  // 기본값 설정 (환경변수 기반)
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
      dedupingInterval: 60000,  // 1분간 중복 제거
      // 오류 발생 시 기존 데이터 유지
      errorRetryInterval: 30000,
      shouldRetryOnError: (error) => {
        // 네트워크 오류만 재시도
        return !error?.message?.includes('404');
      }
    }
  );

  // 강제 갱신 함수
  const forceRefresh = async () => {
    return await mutate(
      edgeFunctionFetcher('database-reader', {
        action: 'get_market_overview',
        maxAge: 0,  // 무조건 새 데이터
        fallbackToAPI: true,
        forceRefresh: true
      }),
      { revalidate: false }
    );
  };

  // 데이터 신선도 계산
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
    // 캐시 상태 정보
    cacheInfo: {
      maxAge: config.maxAge || defaultMaxAge,
      refreshInterval: config.refreshInterval || defaultRefreshInterval,
      source: data?.source || 'unknown'
    }
  };
};
```

### Phase 5: 모니터링 & 알림 시스템 (1일)

#### 5.1 데이터 품질 모니터링
```typescript
// 데이터 수집 성공률 추적
interface DataQualityMetrics {
  collection_success_rate: number;
  api_error_count: number;
  cache_hit_rate: number;
  data_freshness_avg: number;  // 평균 데이터 신선도 (분)
}

// 알림 트리거 조건
const ALERT_THRESHOLDS = {
  collection_failure_rate: 0.2,  // 20% 이상 실패
  data_staleness_hours: 6,       // 6시간 이상 오래된 데이터
  api_error_consecutive: 3       // 연속 3회 API 오류
};
```

#### 5.2 Slack 알림 연동
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

## 4. TDD 접근법 및 검증 전략

### 4.1 테스트 피라미드 구조

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

### 4.2 데이터베이스 검증 전략

#### A. 스키마 테스트
```sql
-- tests/schema/validate_market_indicators.sql
DO $$
BEGIN
  -- 테이블 존재 확인
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'market_indicators_cache'
  )), 'market_indicators_cache table must exist';

  -- 필수 컬럼 확인
  ASSERT (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'market_indicators_cache'
    AND column_name IN ('indicator_type', 'data_value', 'data_source')
  ) = 3, 'Required columns must exist';

  -- 인덱스 확인
  ASSERT (SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'market_indicators_cache'
    AND indexname = 'idx_market_indicators_type_active'
  )), 'Performance index must exist';
END $$;
```

#### B. 데이터 무결성 테스트
```typescript
// tests/database/data-integrity.test.ts
describe('Data Integrity', () => {
  it('should maintain referential integrity', async () => {
    // Foreign key constraints 테스트
    await expect(insertInvalidReference()).rejects.toThrow();
  });

  it('should enforce data validation rules', async () => {
    // CHECK constraints 테스트
    await expect(insertDataWithInvalidEnum()).rejects.toThrow();
  });

  it('should handle concurrent writes correctly', async () => {
    // Race condition 테스트
    const promises = Array(10).fill(null).map(() =>
      saveMarketIndicator({ indicator_type: 'fear_greed', /* ... */ })
    );

    await Promise.all(promises);

    const count = await countMarketIndicators('fear_greed');
    expect(count).toBe(10);
  });
});
```

### 4.3 성능 테스트

#### A. 로드 테스트
```typescript
// tests/performance/load-test.ts
describe('Performance Tests', () => {
  it('should handle high concurrent requests', async () => {
    const startTime = Date.now();

    // 100개 동시 요청 시뮬레이션
    const promises = Array(100).fill(null).map(() =>
      fetch(`${FUNCTIONS_URL}/database-reader`, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_market_overview' })
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    expect(responses.every(r => r.ok)).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000);  // 5초 이내
  });
});
```

#### B. 캐시 히트율 테스트
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

## 5. 배포 및 모니터링

### 5.1 단계별 배포 전략

#### Stage 1: Development (Local)
```bash
# 로컬 환경 설정
supabase start
supabase db reset
supabase functions serve

# 테스트 실행
npm run test:unit
npm run test:integration
```

#### Stage 2: Staging (Supabase Preview)
```bash
# Preview 환경 배포
supabase link --project-ref staging-project
supabase db push
supabase functions deploy

# Staging 테스트
npm run test:e2e:staging
```

#### Stage 3: Production (Blue-Green Deployment)
```bash
# Production 배포 (무중단)
supabase functions deploy --project-ref production
# 트래픽 점진적 전환: 10% → 50% → 100%
```

### 5.2 모니터링 대시보드

#### A. 핵심 메트릭
- **데이터 신선도**: 최근 수집된 데이터의 나이
- **API 성공률**: 외부 API 호출 성공 비율
- **캐시 히트율**: DB에서 제공되는 요청 비율
- **응답 시간**: 평균/95백분위 응답 시간
- **오류율**: 4xx/5xx 오류 비율

#### B. 알림 규칙
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
    threshold: 0.8,  // 80% 미만
    severity: 'INFO',
    action: 'investigate_cache'
  }
};
```

## 6. 마이그레이션 계획

### 6.1 점진적 전환 전략

#### Week 1: 인프라 구축
- [ ] 데이터베이스 스키마 배포
- [ ] 데이터 수집기 구현 및 테스트
- [ ] 수동 데이터 수집 검증

#### Week 2: 자동화 구현
- [ ] GitHub Actions 워크플로우 설정
- [ ] 스케줄링 테스트 및 검증
- [ ] 모니터링 시스템 구축

#### Week 3: 하이브리드 운영
- [ ] 프론트엔드에서 DB + API 병행 조회
- [ ] 캐시 히트율 모니터링
- [ ] 성능 비교 분석

#### Week 4: 완전 전환
- [ ] 실시간 API 호출 제거
- [ ] DB 전용 데이터 소싱
- [ ] 최종 성능 검증

### 6.2 롤백 계획
```typescript
// 긴급 롤백을 위한 feature flag 및 설정값들
interface FeatureFlags {
  useCachedData: boolean;       // 캐시 데이터 사용 여부
  maxCacheAge: number;          // 캐시 최대 나이 (시간)
  fallbackEnabled: boolean;     // Fallback 활성화
  realtimeOnlyMode: boolean;    // 실시간 전용 모드
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

  // 긴급 롤백: 실시간 전용 모드
  if (flags.realtimeOnlyMode) {
    console.log('🚨 Emergency mode: Using realtime API only');
    return await getRealTimeMarketData(indicatorType);
  }

  // 일반적인 캐시 사용
  if (flags.useCachedData) {
    return await getCachedMarketData({
      indicatorType,
      maxAge: flags.maxCacheAge * 3600,
      fallbackToAPI: flags.fallbackEnabled
    });
  } else {
    // 캐시 비활성화 시 기존 방식
    console.log('📡 Cache disabled: Using realtime API');
    return await getRealTimeMarketData(indicatorType);
  }
}
```

## 7. 성공 지표 (KPIs)

### 7.1 기술적 KPIs
- **페이지 로딩 시간**: 3초 → 1초 미만
- **API 사용량**: 100+ calls/day → 50 calls/day
- **캐시 히트율**: 0% → 95%+
- **시스템 가용성**: 99.5% → 99.9%

### 7.2 비즈니스 KPIs
- **사용자 이탈률**: 감소 목표 20%
- **페이지 체류 시간**: 증가 목표 30%
- **API 비용**: 감소 목표 50%
- **확장성**: 동시 사용자 1000명+ 지원

## 8. 리스크 관리

### 8.1 주요 리스크 요소
1. **데이터 수집 실패**: API 장애, 네트워크 문제
2. **스케줄링 실패**: GitHub Actions, Vercel Cron 장애
3. **데이터베이스 장애**: Supabase DB 다운타임
4. **데이터 불일치**: 실시간 vs 캐시 데이터 차이

### 8.2 완화 전략
```typescript
// Multi-layer fallback 시스템
async function getMarketDataWithFallback() {
  try {
    // 1차: 캐시된 데이터
    return await getCachedData();
  } catch (error) {
    console.warn('Cache failed, trying real-time API');

    try {
      // 2차: 실시간 API
      return await getRealTimeData();
    } catch (error) {
      console.error('Real-time API failed, using static fallback');

      // 3차: 정적 폴백 데이터
      return getStaticFallbackData();
    }
  }
}
```

## 9. 결론

이 아키텍처는 현재의 실시간 API 호출 방식에서 캐시 기반 시스템으로의 전환을 통해:

1. **성능 향상**: 페이지 로딩 시간 대폭 단축
2. **비용 최적화**: API 사용량 50% 감소
3. **안정성 증대**: 외부 API 의존성 감소
4. **확장성**: 사용자 증가에 대응 가능한 구조

TDD 접근법을 통해 각 단계별로 검증하며, 점진적 마이그레이션을 통해 리스크를 최소화하여 안정적으로 새로운 아키텍처로 전환할 수 있습니다.


 🎉 Docker 실행 후 문제 해결 결과

  ✅ 성공한 부분:

  1. Docker 실행: Docker Desktop 정상 시작
  2. Supabase 로컬 환경: 성공적으로 시작됨
  3. 데이터베이스 마이그레이션: 새 테이블들이 성공적으로 생성됨
    - market_indicators_cache ✅
    - cache_config ✅
    - economic_indicators ✅
  4. Edge Functions: 로컬에서 정상 실행중

  📊 현재 상태:

  - 로컬 DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
  - Functions: http://127.0.0.1:54321/functions/v1/
  - 마이그레이션: 모든 새 테이블 생성 완료

  🚀 다음 단계:

  이제 원격 프로덕션 데이터베이스에도 마이그레이션을 적용해야 합니다.
  네트워크 문제로 CLI가 실패하므로, Supabase Dashboard에서 수동으로 SQL을
  실행하는 것이 가장 안전한 방법입니다.

  사용자가 해야 할 작업:
  1. https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk 접속
  2. SQL Editor에서 마이그레이션 파일 내용 실행

  계속 진행하시겠습니까?
  