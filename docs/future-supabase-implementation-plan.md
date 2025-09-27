# 추후 Supabase 데이터 저장/수집 시스템 재구현 계획

## 문서 작성 배경

2025년 9월 27일 현재, 시스템을 Direct API 호출 방식으로 변경하면서 data-collector 및 database-reader 함수들을 제거했습니다. 이는 실시간 데이터 제공을 위한 임시 조치이며, 향후 API 비용 최적화와 안정성 향상을 위해 Supabase 기반 캐싱 시스템을 다시 구현할 필요가 있습니다.

## 현재 아키텍처 (Direct API 방식)

### 장점
- ✅ **실시간 데이터**: 항상 최신 마켓 데이터 제공
- ✅ **단순한 구조**: 복잡한 캐싱 로직 없음
- ✅ **Yahoo Finance 무료 API**: API 키 불필요

### 단점
- ❌ **API 호출 비용**: 매 요청마다 외부 API 호출
- ❌ **성능 이슈**: 네트워크 지연시간 발생
- ❌ **Rate Limiting**: Yahoo Finance API 제한에 의존
- ❌ **장애 전파**: 외부 API 장애 시 서비스 전체 영향

## 향후 Supabase 기반 하이브리드 아키텍처

### 개요
실시간성과 성능을 균형 있게 제공하는 하이브리드 시스템을 구축합니다.

### 핵심 구성 요소

#### 1. Data Collector (데이터 수집기)
```typescript
// 위치: supabase/functions/data-collector-v2/index.ts

interface DataCollectorConfig {
  collectInterval: number;        // 수집 주기 (예: 5분)
  marketHours: boolean;          // 장 시간 중 더 자주 수집
  retryPolicy: RetryConfig;      // 실패 시 재시도 정책
  sources: DataSource[];         // 다중 데이터 소스
}

interface DataSource {
  name: string;                  // 'yahoo_finance', 'alpha_vantage', etc.
  priority: number;              // 우선순위 (1=최고)
  enabled: boolean;
  apiKey?: string;
  rateLimit: RateLimitConfig;
}
```

**기능:**
- 주기적 마켓 데이터 수집 (장 시간: 5분, 장 외: 30분)
- 다중 API 소스 지원 (Yahoo Finance → Alpha Vantage → Twelve Data)
- 실패 시 자동 백업 소스 전환
- 수집된 데이터 Supabase DB 저장

#### 2. Smart Cache Manager (스마트 캐시 관리자)
```typescript
// 위치: supabase/functions/cache-manager/index.ts

interface CachePolicy {
  maxAge: number;               // 최대 캐시 시간
  staleWhileRevalidate: number; // 백그라운드 갱신 시간
  marketHoursMaxAge: number;    // 장 시간 중 최대 캐시 시간
  afterHoursMaxAge: number;     // 장 외 시간 최대 캐시 시간
}

interface CacheEntry {
  data: MarketData;
  timestamp: string;
  source: string;
  isStale: boolean;
  expiresAt: string;
}
```

**기능:**
- 데이터 신선도 기반 캐시 관리
- 장 시간 vs 장 외 시간 차별화된 캐시 정책
- Stale-While-Revalidate 패턴 구현
- 캐시 히트율 모니터링

#### 3. Hybrid Data Fetcher (하이브리드 데이터 패처)
```typescript
// 위치: supabase/functions/market-data-hybrid/index.ts

async function getMarketData(symbol: string): Promise<MarketData> {
  // 1. 캐시 확인
  const cached = await getCachedData(symbol);

  // 2. 캐시가 신선하면 즉시 반환
  if (cached && !cached.isStale) {
    return cached.data;
  }

  // 3. 캐시가 stale하면 백그라운드 갱신 + 기존 데이터 반환
  if (cached && cached.isStale) {
    refreshInBackground(symbol);
    return cached.data;
  }

  // 4. 캐시 미스 시 실시간 데이터 수집
  return await fetchRealTimeData(symbol);
}
```

### 데이터베이스 스키마

#### 1. market_indicators_cache (개선된 캐시 테이블)
```sql
CREATE TABLE market_indicators_cache (
  id BIGSERIAL PRIMARY KEY,
  indicator_type VARCHAR(50) NOT NULL,
  symbol VARCHAR(20),
  data_value JSONB NOT NULL,
  metadata JSONB,
  data_source VARCHAR(50) NOT NULL,
  collection_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_stale BOOLEAN DEFAULT FALSE,
  cache_hits INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),

  -- 인덱스 최적화
  INDEX idx_indicator_type_symbol (indicator_type, symbol),
  INDEX idx_expires_at (expires_at),
  INDEX idx_is_stale (is_stale)
);
```

#### 2. data_collection_logs (수집 로그)
```sql
CREATE TABLE data_collection_logs (
  id BIGSERIAL PRIMARY KEY,
  collection_run_id UUID NOT NULL,
  source VARCHAR(50) NOT NULL,
  symbol VARCHAR(20),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_collection_run_id (collection_run_id),
  INDEX idx_collected_at (collected_at),
  INDEX idx_success (success)
);
```

#### 3. api_usage_tracking (API 사용량 추적)
```sql
CREATE TABLE api_usage_tracking (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(100),
  requests_made INTEGER DEFAULT 0,
  rate_limit_remaining INTEGER,
  reset_time TIMESTAMPTZ,
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  INDEX idx_provider_tracked_at (provider, tracked_at)
);
```

### 구현 단계별 계획

#### Phase 1: 기본 캐싱 시스템 (2주)
1. **데이터베이스 스키마 설정**
   - market_indicators_cache 테이블 생성
   - 기본 인덱스 설정

2. **Basic Data Collector 구현**
   - Yahoo Finance API 기반 데이터 수집
   - 기본 스케줄링 (GitHub Actions 또는 Supabase Cron)

3. **Cache-First Data Fetcher 구현**
   - 캐시 우선 조회 로직
   - 캐시 미스 시 실시간 API 호출

#### Phase 2: 스마트 캐시 관리 (2주)
1. **Stale-While-Revalidate 구현**
   - 백그라운드 데이터 갱신
   - 사용자 경험 최적화

2. **다중 API 소스 지원**
   - Alpha Vantage, Twelve Data 백업 구현
   - 자동 failover 로직

3. **캐시 성능 모니터링**
   - 히트율 추적
   - 성능 메트릭 대시보드

#### Phase 3: 고급 기능 (2주)
1. **Rate Limiting 관리**
   - API 사용량 추적
   - 동적 요청 조절

2. **데이터 품질 관리**
   - 이상 데이터 감지
   - 데이터 검증 로직

3. **자동 스케일링**
   - 트래픽 기반 수집 주기 조절
   - 비용 최적화 알고리즘

### 마이그레이션 전략

#### 1. 점진적 마이그레이션
```typescript
// Feature Flag 기반 점진적 전환
const USE_CACHE_SYSTEM = process.env.ENABLE_CACHE_SYSTEM === 'true';

if (USE_CACHE_SYSTEM) {
  return await hybridDataFetcher();
} else {
  return await directApiFetcher(); // 현재 방식
}
```

#### 2. A/B 테스트
- 사용자의 일정 비율에게만 캐시 시스템 적용
- 성능 및 정확성 비교 분석
- 점진적 롤아웃

#### 3. 백워드 호환성
- 기존 API 엔드포인트 유지
- 응답 형식 동일하게 보장
- 원활한 프론트엔드 연동

### 모니터링 및 알림

#### 1. 핵심 메트릭
- **캐시 히트율**: 목표 90% 이상
- **데이터 신선도**: 평균 5분 이내
- **API 응답시간**: 평균 200ms 이하
- **에러율**: 1% 이하

#### 2. 알림 설정
- 캐시 히트율 80% 이하 시 알림
- 데이터 수집 실패 3회 연속 시 알림
- API 레이트 리밋 80% 도달 시 알림

### 비용 최적화 예상 효과

#### Before (현재 Direct API)
- API 호출 수: ~1,000회/일
- 응답 시간: 평균 1-2초
- 장애 의존성: 외부 API에 완전 의존

#### After (Supabase 하이브리드)
- API 호출 수: ~50회/일 (95% 감소)
- 응답 시간: 평균 100-200ms (80% 개선)
- 장애 복원력: 캐시를 통한 부분 서비스 유지

### 기술적 고려사항

#### 1. 데이터 일관성
- 여러 API 소스 간 데이터 차이 처리
- 타임스탬프 기반 데이터 동기화
- 이상 데이터 필터링

#### 2. 확장성
- 새로운 마켓 지표 추가 용이성
- 다양한 마켓 (암호화폐, 원자재 등) 지원 준비
- 글로벌 마켓 시간대 고려

#### 3. 보안
- API 키 안전한 관리 (Supabase Vault 활용)
- 데이터 액세스 로그 기록
- Rate limiting을 통한 남용 방지

### 현재 제거된 캐시/데이터베이스 구조 분석 (2025년 9월 27일)

#### 제거된 구조 현황
현재 Direct API 방식으로의 완전 전환을 위해 다음과 같은 캐시/데이터베이스 관련 코드들이 제거되었습니다:

#### 1. 제거된 Edge Functions
- **data-collector**: 주기적 마켓 데이터 수집 함수
- **database-reader**: 캐시된 데이터 조회 함수

#### 2. 제거된 타입 정의 (`_shared/types.ts`)
```typescript
// 제거된 캐시 관련 타입들:
export interface CachedMarketData {
  // 데이터베이스 캐시 구조
}

export interface MarketDataFreshness {
  // 데이터 신선도 관리
}

export interface DatabaseReaderResponse {
  // 데이터베이스 응답 포맷
}
```

#### 3. 제거된 데이터 변환 로직 (`_shared/data-transformers.ts`)
- `convertCachedDataToMarketOverview()`: 캐시 데이터를 마켓 오버뷰로 변환
- `generateMockMarketOverview()`: 모킹 데이터 생성 (완전 제거)

#### 4. 제거된 데이터베이스 의존성
- Supabase 클라이언트를 통한 직접 데이터베이스 접근
- 캐시 히트율 계산 로직
- 데이터 신선도 관리 시스템

#### 5. 현재 구조 (Direct API Only)
```typescript
// market-overview/index.ts - 현재 구조
async function fetchLiveMarketData(): Promise<DatabaseReaderResponse> {
  // Yahoo Finance API 직접 호출
  const [sp500Data, vixData, nasdaqData, dowData] = await Promise.all([
    fetchYahooFinanceData('SPY'),
    fetchYahooFinanceData('^VIX'),
    fetchYahooFinanceData('QQQ'),
    fetchYahooFinanceData('DIA')
  ]);

  // 실시간 데이터만 반환, 캐시 로직 없음
}
```

#### 6. 제거 전 하이브리드 구조 참고사항
재구현 시 참고할 이전 아키텍처:
- **Cache-First Strategy**: 캐시 우선 조회 후 API 백업
- **Stale-While-Revalidate**: 백그라운드 갱신 패턴
- **Multi-Source Fallback**: 여러 API 소스 간 자동 전환
- **Rate Limiting**: API 사용량 추적 및 제한 관리

### 결론

이 계획은 현재의 실시간 성능을 유지하면서도 장기적으로 안정성과 비용 효율성을 확보하기 위한 로드맵입니다. 단계별 구현을 통해 리스크를 최소화하고, 사용자 경험을 저해하지 않으면서 시스템을 점진적으로 개선할 수 있습니다.

**현재 상태 (2025년 9월 27일)**: 모든 캐시/데이터베이스 관련 코드 제거 완료, Pure API-based 구조로 전환

**다음 단계**: Phase 1 구현을 위한 상세 기술 명세서 작성 및 개발 일정 수립

---

*작성일: 2025년 9월 27일*
*작성자: Claude Code Assistant*
*버전: 1.0*