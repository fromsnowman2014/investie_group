# API Key 사용 가이드

## 📋 개요

이 문서는 main branch에 최근 적용된 API key 시스템 사용 방법을 정리한 엔지니어 참고 문서입니다. 

최근 merge된 개선사항:
- Multi-provider API 시스템 (Alpha Vantage + Yahoo Finance + Twelve Data)
- Supabase Edge Functions 통합
- Rate limit 자동 처리 및 fallback
- 정확한 S&P 500 인덱스 데이터

## 🔧 환경 설정

### 1. 환경 변수 설정

```bash
# .env.local (개발 환경)
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Supabase Edge Functions 환경 변수

Supabase Dashboard → Project Settings → Edge Functions:
```bash
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
FRED_API_KEY=your-fred-api-key (선택사항)
```

## 🚀 API 호출 방법

### 1. edgeFunctionFetcher 사용 (권장)

```typescript
import { edgeFunctionFetcher } from '@/lib/api-utils';

// 기본 사용법
const data = await edgeFunctionFetcher('market-overview');

// 페이로드와 함께 사용
const stockData = await edgeFunctionFetcher('stock-data', { symbol: 'AAPL' });

// 타입 지정
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

## ⚠️ Rate Limit 처리

### 1. 자동 Fallback 시스템
- **Alpha Vantage** (우선순위 1): 25 calls/day 무료
- **Yahoo Finance** (우선순위 2): 무제한 비공식 API
- **Twelve Data** (우선순위 3): 데모 키 백업

### 2. Rate Limit 감지 및 UI 표시
```typescript
// Rate limit 상태 확인
if (data.alphaVantageRateLimit?.isLimited) {
  // 사용자에게 제한 상태 표시
  return (
    <div className="rate-limit-warning">
      <p>일일 API 한도 도달. 내일 다시 이용 가능합니다.</p>
      <p>현재는 대체 데이터 소스를 사용합니다.</p>
    </div>
  );
}
```

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

## 🚨 주의사항

1. **환경 변수**: production에서 API 키가 올바르게 설정되었는지 확인
2. **Rate Limit**: Alpha Vantage는 하루 25회 제한이 있음
3. **타입 안정성**: edgeFunctionFetcher 사용 시 타입 지정 권장
4. **에러 처리**: 네트워크 오류 및 API 제한에 대한 적절한 fallback 구현

## 📚 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Alpha Vantage API 문서](https://www.alphavantage.co/documentation/)
- [SWR 문서](https://swr.vercel.app/)

---
**마지막 업데이트**: 2024년 9월 14일
**작성자**: AI Assistant (Claude Code)