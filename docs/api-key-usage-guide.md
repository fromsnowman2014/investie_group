# API Key 사용 가이드

## 📋 개요

이 문서는 main branch에 최근 적용된 API key 시스템 사용 방법을 정리한 엔지니어 참고 문서입니다. 

최근 merge된 개선사항:
- Multi-provider API 시스템 (Alpha Vantage + Yahoo Finance + Twelve Data)
- Supabase Edge Functions 통합
- Rate limit 자동 처리 및 fallback
- 정확한 S&P 500 인덱스 데이터

## 🔧 환경 설정

### ✅ 현재 프로덕션 환경 상태

**이미 설정 완료된 환경 변수들**:
- `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`: Vercel에 설정됨
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Vercel에 설정됨  
- `ALPHA_VANTAGE_API_KEY`: Supabase Edge Functions에 설정됨
- `FRED_API_KEY`: Supabase Edge Functions에 설정됨 (선택사항)

### 💡 개발자가 알아야 할 점

**추가 설정 불필요**: 모든 API 키와 환경 변수가 이미 프로덕션 서버에 설정되어 있습니다.

**로컬 개발 시에만**: 필요한 경우 `.env.local` 파일 생성:
```bash
# 로컬 테스트용 (선택사항)
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**자동 Fallback**: 환경 변수가 없어도 코드에서 자동으로 프로덕션 URL 사용

### 🖥️ 현재 서버 구성

**프로덕션 Supabase Functions URL**: 
- `https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1`

**사용 가능한 Edge Functions**:
- `market-overview`: 시장 지수, 경제 지표, Fear & Greed Index
- `stock-data`: 개별 주식 실시간 데이터
- `ai-analysis`: AI 투자 분석 (개발 중)
- `news-analysis`: 뉴스 분석 (개발 중)

**Multi-Provider 시스템 동작**:
1. Alpha Vantage API (25 calls/day) → 2. Yahoo Finance (무제한) → 3. Twelve Data (백업)

## 🚀 API 사용법 (바로 사용 가능)

### 1. edgeFunctionFetcher 사용 (권장)

모든 환경 설정이 완료되어 있어 **바로 사용 가능**합니다:

```typescript
import { edgeFunctionFetcher } from '@/lib/api-utils';

// ✅ 시장 지수 + 경제 지표 (가장 많이 사용)
const marketData = await edgeFunctionFetcher('market-overview');

// ✅ 개별 주식 데이터
const stockData = await edgeFunctionFetcher('stock-data', { symbol: 'AAPL' });

// ✅ 타입 안전성을 위해 타입 지정 권장
const data = await edgeFunctionFetcher<MarketOverviewResponse>('market-overview');
```

### 2. SWR과 함께 사용

```typescript
import useSWR from 'swr';
import { edgeFunctionFetcher } from '@/lib/api-utils';

function MyComponent() {
  const { data, error, isLoading } = useSWR(
    'market-overview',
    () => edgeFunctionFetcher<MarketOverviewResponse>('market-overview'),
    { refreshInterval: 300000 } // 5분
  );

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{/* 데이터 렌더링 */}</div>;
}
```

## 📊 사용 가능한 Edge Functions

### 1. market-overview
**목적**: 시장 지수, 경제 지표, Fear & Greed 인덱스
```typescript
// 호출 방법
const data = await edgeFunctionFetcher('market-overview');

// 응답 타입
interface MarketOverviewResponse {
  indices: {
    sp500: IndexData;
    nasdaq: IndexData;
    dow: IndexData;
  };
  sectors: SectorData[];
  economicIndicators?: {
    interestRate?: EconomicIndicator;
    cpi?: EconomicIndicator;
    unemployment?: EconomicIndicator;
  };
  fearGreedIndex?: {
    value: number;
    status: string;
  };
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
  };
}
```

### 2. stock-data
**목적**: 개별 주식 데이터
```typescript
// 호출 방법
const data = await edgeFunctionFetcher('stock-data', { symbol: 'AAPL' });

// 응답 타입
interface StockPriceData {
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  pe?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  source: string;
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
  };
}
```

### 3. ai-analysis, news-analysis (기타 AI 기능)
```typescript
// AI 분석
const analysis = await edgeFunctionFetcher('ai-analysis', { symbol: 'AAPL' });

// 뉴스 분석
const news = await edgeFunctionFetcher('news-analysis', { symbol: 'AAPL' });
```

## ⚠️ Rate Limit 자동 처리 (걱정 없음)

### ✅ 자동 Fallback 시스템 동작 중

**개발자가 신경 쓸 필요 없는 이유**:
- Alpha Vantage 25회 제한 → 자동으로 Yahoo Finance 사용
- Yahoo Finance 무제한 → 안정적인 백업 제공
- 사용자에게 자동으로 상황 안내

### 선택적: UI에 Rate Limit 상태 표시

필요시에만 다음 패턴 사용:
```typescript
// 선택적: Rate limit 상태 표시
if (data.alphaVantageRateLimit?.isLimited) {
  return (
    <div className="rate-limit-warning">
      <p>📊 실시간 데이터는 대체 소스를 사용합니다</p>
      <p>🕒 Alpha Vantage API는 내일 재설정됩니다</p>
    </div>
  );
}
```

**대부분의 경우**: Rate limit 처리가 백그라운드에서 자동 동작

## 🎯 실제 사용 예시

### Market Indicators 컴포넌트
```typescript
// apps/web/src/app/components/MarketIntelligence/EnhancedMacroIndicatorsDashboard.tsx

const fetcher = async (): Promise<EnhancedMarketSummary> => {
  const apiResponse = await edgeFunctionFetcher<unknown>('market-overview');
  
  // API 응답 변환 로직
  const transformedData: EnhancedMarketSummary = {
    fearGreedIndex: responseObj.fearGreedIndex ? {
      value: Number(responseObj.fearGreedIndex.value) || 50,
      status: responseObj.fearGreedIndex.status || 'neutral'
    } : null,
    // ... 기타 변환
  };
  
  return transformedData;
};

const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
  'market-overview',
  fetcher,
  { refreshInterval: getRefreshInterval() }
);
```

## 🔍 디버깅 도구

### 1. API 디버거 컴포넌트
```typescript
// 개발 중 API 상태 확인
import APIDebugger from '@/app/components/APIDebugger';

function Layout() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <APIDebugger />}
      {/* 메인 컨텐츠 */}
    </>
  );
}
```

### 2. 테스트 페이지
- `/test-api-debug.html`: API 엔드포인트 테스트
- `/env-debug`: 환경 변수 상태 확인

## 📝 모범 사례

### 1. 에러 처리
```typescript
try {
  const data = await edgeFunctionFetcher('market-overview');
  // 성공 처리
} catch (error) {
  console.error('API 호출 실패:', error);
  // fallback UI 표시
}
```

### 2. 타입 안정성
```typescript
// 인터페이스 정의
interface MarketData {
  // 필드 정의
}

// 타입 지정하여 사용
const data = await edgeFunctionFetcher<MarketData>('market-overview');
```

### 3. 캐싱 전략
```typescript
const { data } = useSWR(
  'market-overview',
  fetcher,
  {
    refreshInterval: 300000, // 5분
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1분 중복 제거
  }
);
```

## ✅ 개발자 체크리스트

### 필수 사항 (꼭 해주세요)
1. **타입 안전성**: `edgeFunctionFetcher<T>()` 타입 지정
2. **에러 처리**: try-catch 블록으로 API 호출 감싸기
3. **SWR 사용**: 데이터 캐싱과 자동 재시도를 위해 권장

### 자동 처리됨 (신경 안 써도 됨)
- ✅ **환경 변수**: 이미 프로덕션 서버에 설정 완료
- ✅ **API 키**: Supabase와 Vercel에 안전하게 저장됨
- ✅ **Rate Limit**: Multi-provider 시스템이 자동 처리
- ✅ **Fallback URL**: 환경 변수 없어도 자동 설정

## 📚 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Alpha Vantage API 문서](https://www.alphavantage.co/documentation/)
- [SWR 문서](https://swr.vercel.app/)

---
**마지막 업데이트**: 2024년 9월 14일
**작성자**: AI Assistant (Claude Code)