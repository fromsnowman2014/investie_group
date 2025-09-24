# Supabase Edge Functions에서 Vercel로 환경변수 마이그레이션 계획

## 📋 문제 분석

현재 `data-collector`와 `database-reader` Edge Functions에서 데이터 저장/읽기 문제가 발생하고 있습니다. 주요 원인 분석:

### 🔍 현재 아키텍처 분석

1. **API Key 위치**: Supabase Edge Functions 환경변수에 저장
   - `ALPHA_VANTAGE_API_KEY`
   - `FRED_API_KEY`
   - `CLAUDE_API_KEY`
   - `OPENAI_API_KEY`

2. **문제점**:
   - Edge Functions가 API 호출을 담당하지만 환경변수 접근에 제약
   - Frontend에서 직접 API 호출 시 환경변수 접근 불가
   - Rate limiting 및 에러 처리의 복잡성

3. **제안하는 해결책**:
   - API Keys를 Vercel 환경변수로 이동
   - Frontend에서 직접 API 호출로 아키텍처 단순화
   - Supabase는 데이터 저장소로만 활용

## 🎯 마이그레이션 목표

1. **안정성 향상**: API 호출 실패 시 더 나은 에러 핸들링
2. **단순화**: 아키텍처 복잡성 감소
3. **투명성**: 클라이언트 사이드에서 API 상태 직접 관리
4. **성능**: 불필요한 Edge Function 호출 제거

## 🚀 마이그레이션 전략

### Phase 1: 환경변수 이동 (안전한 방식)
1. Vercel에 환경변수 추가 (기존 Supabase 환경변수 유지)
2. 하이브리드 모드로 테스트
3. 점진적 전환

### Phase 2: 코드 리팩토링
1. Frontend API 클라이언트 구현
2. Edge Functions 단순화 또는 제거
3. 에러 핸들링 개선

### Phase 3: 검증 및 정리
1. 전체 시스템 테스트
2. 사용하지 않는 Edge Functions 제거
3. 문서 업데이트

## 📊 현재 API Key 사용 현황

### Supabase Edge Functions에서 사용 중인 API Keys:

1. **ALPHA_VANTAGE_API_KEY**
   - 사용처: `data-collector/index.ts`
   - 용도: S&P 500, VIX 데이터 수집
   - Rate Limit: 25 calls/day

2. **FRED_API_KEY**
   - 사용처: `data-collector/index.ts`
   - 용도: Treasury, Unemployment, CPI 데이터
   - Rate Limit: 높음 (통상 1000+ calls/day)

3. **CLAUDE_API_KEY** & **OPENAI_API_KEY**
   - 사용처: AI 분석 기능
   - 용도: 선택적 AI 분석
   - Rate Limit: API 플랜에 따라 다름

## 🔧 마이그레이션 상세 계획

### Step 1: Vercel 환경변수 설정 (사용자 작업)

#### 1.1 Vercel Dashboard 접근
```bash
# Vercel CLI 설치 (필요시)
npm i -g vercel

# 프로젝트에 로그인
vercel login
vercel link
```

#### 1.2 환경변수 추가
Vercel Dashboard → Project Settings → Environment Variables에서 다음 추가:

**Production & Preview & Development 모두에 추가:**
```
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
NEXT_PUBLIC_FRED_API_KEY=your-fred-api-key
NEXT_PUBLIC_CLAUDE_API_KEY=your-claude-api-key (선택사항)
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key (선택사항)
```

**⚠️ 보안 참고사항:**
- 클라이언트 사이드에서 사용하므로 `NEXT_PUBLIC_` 접두사 필요
- API Keys가 브라우저에 노출됨 (Domain restriction 권장)
- Alpha Vantage, FRED 등은 공개 API이므로 상대적으로 안전

#### 1.3 현재 API Key 값 확인
```bash
# Supabase Edge Functions 환경변수 확인 (Supabase Dashboard)
supabase secrets list
```

### Step 2: Frontend API 클라이언트 구현

#### 2.1 새로운 API 유틸리티 생성
`apps/web/src/lib/direct-api-client.ts` 파일 생성:

```typescript
// Alpha Vantage 직접 호출
export async function fetchStockDataDirect(symbol: string) {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;
  // Rate limiting, error handling 포함
}

// FRED API 직접 호출
export async function fetchEconomicDataDirect(seriesId: string) {
  const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;
  // 구현 세부사항
}
```

#### 2.2 기존 SWR Hook 수정
```typescript
// 기존: Edge Function 호출
const { data } = useSWR('market-overview', edgeFunctionFetcher);

// 변경 후: 직접 API 호출
const { data } = useSWR('market-overview', fetchMarketDataDirect);
```

### Step 3: 하이브리드 모드 구현

#### 3.1 Feature Flag 도입
```typescript
const USE_DIRECT_API = process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true';

export function getMarketData() {
  if (USE_DIRECT_API) {
    return fetchMarketDataDirect();
  } else {
    return edgeFunctionFetcher('market-overview');
  }
}
```

#### 3.2 점진적 전환 테스트
1. `NEXT_PUBLIC_USE_DIRECT_API=false` (기존 방식)
2. `NEXT_PUBLIC_USE_DIRECT_API=true` (새로운 방식)
3. A/B 테스트를 통한 검증

### Step 4: Edge Functions 단순화

#### 4.1 data-collector 수정
```typescript
// 기존: 복잡한 API 호출 + DB 저장
// 변경 후: Frontend에서 전달받은 데이터만 DB 저장
export default async function handler(req) {
  const { action, data } = await req.json();

  if (action === 'save_market_data') {
    // Frontend에서 수집한 데이터를 DB에 저장만
    return await saveToDatabase(data);
  }
}
```

#### 4.2 database-reader 유지
- 캐시 로직은 그대로 유지
- API 호출 부분만 제거

### Step 5: 에러 핸들링 및 Rate Limiting 구현

#### 5.1 Rate Limiting 전략
```typescript
class APIRateLimiter {
  private limits = new Map();

  async checkLimit(apiKey: string, provider: string) {
    // Rate limit 체크 로직
    // Local Storage 또는 Redis 사용
  }
}
```

#### 5.2 Fallback API 체인
```typescript
const API_PROVIDERS = [
  { name: 'alpha_vantage', key: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY },
  { name: 'yahoo_finance', key: null }, // 무료 API
  { name: 'twelve_data', key: process.env.NEXT_PUBLIC_TWELVE_DATA_KEY }
];
```

## 🧪 테스트 계획

### 테스트 Phase 1: 환경변수 설정 검증
```bash
# 로컬 테스트
npm run dev
# 브라우저 콘솔에서 확인
console.log(process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY);
```

### 테스트 Phase 2: API 호출 테스트
```typescript
// 각 API 개별 테스트
await fetchStockDataDirect('AAPL');
await fetchEconomicDataDirect('DGS10');
```

### 테스트 Phase 3: 통합 테스트
1. 전체 마켓 오버뷰 데이터 수집
2. 데이터베이스 저장 확인
3. 캐시 동작 검증
4. 에러 시나리오 테스트

## 🚨 리스크 관리

### 보안 리스크
- **문제**: API Keys가 클라이언트에 노출
- **완화**:
  - Domain restriction 설정
  - API Key rotation 계획
  - Rate limiting으로 남용 방지

### 성능 리스크
- **문제**: 클라이언트에서 여러 API 호출로 인한 지연
- **완화**:
  - Parallel API 호출
  - 적극적인 캐싱
  - 백그라운드 데이터 수집

### 호환성 리스크
- **문제**: 기존 Edge Functions 의존성
- **완화**:
  - 하이브리드 모드로 점진적 전환
  - 롤백 계획 수립

## 📅 마이그레이션 타임라인

### Week 1: 준비 단계
- [ ] Vercel 환경변수 설정
- [ ] 직접 API 클라이언트 구현
- [ ] 유닛 테스트 작성

### Week 2: 구현 단계
- [ ] 하이브리드 모드 구현
- [ ] Feature flag 도입
- [ ] 통합 테스트

### Week 3: 검증 단계
- [ ] A/B 테스트 실행
- [ ] 성능 모니터링
- [ ] 버그 수정

### Week 4: 완료 단계
- [ ] 기존 Edge Functions 정리
- [ ] 문서 업데이트
- [ ] 모니터링 설정

## 🔄 롤백 계획

### 즉시 롤백
```typescript
// Feature flag를 통한 즉시 롤백
process.env.NEXT_PUBLIC_USE_DIRECT_API = 'false';
```

### 완전 롤백
1. Vercel 환경변수 제거
2. 기존 Edge Functions 재활성화
3. Frontend 코드 원복

## 📊 성공 지표

### 기술적 지표
- [ ] API 호출 성공률 > 95%
- [ ] 페이지 로딩 시간 < 3초
- [ ] 데이터 신뢰성 100%

### 비즈니스 지표
- [ ] 사용자 불만 제로
- [ ] 데이터 수집 안정성 향상
- [ ] 개발 생산성 향상

## 🎯 마이그레이션 후 기대 효과

1. **안정성 향상**: API 호출 실패 시 즉시 대응 가능
2. **투명성**: 클라이언트에서 직접 API 상태 모니터링
3. **단순성**: Edge Functions 복잡성 제거
4. **확장성**: 새로운 API 추가 용이
5. **디버깅**: 클라이언트 사이드 디버깅 도구 활용 가능

## 📞 지원 및 문의

마이그레이션 과정에서 문제 발생 시:
1. GitHub Issues 생성
2. 로그 수집 및 공유
3. 롤백 절차 실행

---

**⚠️ 주의사항**: 이 마이그레이션은 시스템 아키텍처를 크게 변경하므로 충분한 테스트와 백업 후 진행하시기 바랍니다.