# API 구현 예시 모음

## 📋 실제 구현된 코드 예시

이 문서는 main branch에 실제로 구현된 API key 사용 패턴들을 정리한 참고 자료입니다.

## 🎯 1. Market Overview API 구현

### 파일 위치
- `apps/web/src/app/components/MarketIntelligence/EnhancedMacroIndicatorsDashboard.tsx`

### 구현 코드
```typescript
import { edgeFunctionFetcher } from '@/lib/api-utils';

interface EnhancedMarketSummary {
  fearGreedIndex: {
    value: number;
    status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  } | null;
  
  economicIndicators: {
    interestRate: { value: number; change: number; } | null;
    cpi: { value: number; monthOverMonth: number; yearOverYear: number; } | null;
    unemployment: { value: number; } | null;
  } | null;
  
  sp500Sparkline: {
    currentPrice: number;
    weeklyChange: number;
  } | null;
  
  // API Rate Limit 정보
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
    availableTomorrow?: boolean;
  };
}

const fetcher = async (): Promise<EnhancedMarketSummary> => {
  const apiResponse = await edgeFunctionFetcher<unknown>('market-overview');
  
  console.log('🔍 Raw API Response:', apiResponse);
  
  const responseObj = apiResponse as Record<string, unknown>;
  
  // API 응답 형식 감지 및 변환
  if (responseObj.success && responseObj.data) {
    console.log('✅ Using wrapped response format');
    return responseObj.data as EnhancedMarketSummary;
  }
  
  // 직접 응답 형식 처리
  if (responseObj.economicIndicators || responseObj.indices || responseObj.fearGreedIndex) {
    console.log('✅ Using direct response format');
    
    const transformedData: EnhancedMarketSummary = {
      fearGreedIndex: responseObj.fearGreedIndex ? {
        value: Number((responseObj.fearGreedIndex as Record<string, unknown>).value) || 50,
        status: ((responseObj.fearGreedIndex as Record<string, unknown>).status as any) || 'neutral'
      } : null,
      
      economicIndicators: responseObj.economicIndicators ? {
        interestRate: (responseObj.economicIndicators as Record<string, unknown>).interestRate ? {
          value: Number(((responseObj.economicIndicators as Record<string, unknown>).interestRate as Record<string, unknown>).value) || 0,
          change: Number(((responseObj.economicIndicators as Record<string, unknown>).interestRate as Record<string, unknown>).change) || 0
        } : null,
        // ... 기타 변환 로직
      } : null,
      
      sp500Sparkline: (responseObj.indices as Record<string, unknown>)?.sp500 ? {
        currentPrice: Number(((responseObj.indices as Record<string, unknown>).sp500 as Record<string, unknown>).value) || 0,
        weeklyChange: Number(((responseObj.indices as Record<string, unknown>).sp500 as Record<string, unknown>).changePercent) || 0
      } : null,
      
      alphaVantageRateLimit: responseObj.alphaVantageRateLimit as any
    };
    
    return transformedData;
  }
  
  throw new Error('Invalid API response structure');
};

// SWR과 함께 사용
const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
  'market-overview',
  fetcher,
  {
    refreshInterval: getRefreshInterval(), // 동적 새로고침 간격
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
    dedupingInterval: 5000,
  }
);
```

## 🚨 2. Rate Limit UI 처리

### Rate Limit 경고 표시
```typescript
return (
  <div className="enhanced-macro-dashboard">
    {/* API Rate Limit Warning */}
    {data.alphaVantageRateLimit?.isLimited && (
      <div className="rate-limit-warning">
        <div className="warning-header">
          <span className="warning-icon">ℹ️</span>
          <span className="warning-title">Stock Data Temporarily Limited</span>
        </div>
        <div className="warning-content">
          <p>Daily stock market data query limit has been reached.</p>
          <p className="warning-detail">
            📊 <strong>Still Available:</strong> Interest rates, inflation, unemployment
          </p>
          <p className="warning-reset">
            🕒 <strong>Stock Data Reset:</strong> {data.alphaVantageRateLimit.resetTime || 'Tomorrow morning'}
          </p>
          {data.alphaVantageRateLimit.availableTomorrow && (
            <p className="warning-retry">Visit again tomorrow to access real-time stock market data.</p>
          )}
        </div>
      </div>
    )}
    
    {/* S&P 500 지수 표시 - Rate Limit 시 비활성화 */}
    <div className={`indicator-row ${data.alphaVantageRateLimit?.isLimited ? 'rate-limited' : ''}`}>
      <span className="indicator-label">
        S&P 500 Index
        {data.alphaVantageRateLimit?.isLimited && (
          <span className="limited-badge">Limited</span>
        )}
      </span>
      <span className="indicator-value">
        {data.alphaVantageRateLimit?.isLimited ? (
          <span className="unavailable-text">Temporarily Unavailable</span>
        ) : (
          <>
            <span className="price-text">
              {data.sp500Sparkline?.currentPrice ? data.sp500Sparkline.currentPrice.toFixed(2) : '6574.10'}
            </span>
            <span className={`change-badge ${(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? 'positive' : 'negative'}`}>
              {(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? '+' : ''}{(data.sp500Sparkline?.weeklyChange ?? 1.09).toFixed(2)}%
            </span>
          </>
        )}
      </span>
    </div>
  </div>
);
```

## 🔄 3. useAPIData Hook 패턴

### 파일 위치
- `apps/web/src/app/hooks/useAPIData.ts`

### 구현 코드
```typescript
import { edgeFunctionFetcher } from '@/lib/api-utils'

const defaultFetcher = async <T = unknown>(endpoint: string): Promise<T> => {
  const data = await edgeFunctionFetcher<T>(endpoint)
  return data
}

export function useAPIData<T = unknown>(
  url: string | null,
  options: UseAPIDataOptions = {}
): APIDataState<T> {
  const {
    refreshInterval = 300000, // 5분 기본값
    revalidateOnFocus = true,
    shouldRetryOnError = true,
    errorRetryCount = 3
  } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    (endpoint: string) => defaultFetcher<T>(endpoint),
    {
      refreshInterval,
      revalidateOnFocus,
      shouldRetryOnError,
      errorRetryCount,
      errorRetryInterval: 5000,
      dedupingInterval: 60000,
    }
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  }
}
```

## 🏗️ 4. Supabase Edge Function 구조

### Multi-Provider API 시스템
- `supabase/functions/market-overview/api-providers.ts`

### 핵심 구현 패턴
```typescript
// 멀티 프로바이더 매니저 생성
function createMultiProviderManager(alphaVantageApiKey?: string): MultiProviderManager {
  const manager = new MultiProviderManager();
  
  // Alpha Vantage 프로바이더 (최우선)
  if (alphaVantageApiKey) {
    manager.addProvider(new AlphaVantageProvider(alphaVantageApiKey));
  }
  
  // Yahoo Finance 프로바이더 (백업)
  manager.addProvider(new YahooFinanceProvider());
  
  // Twelve Data 프로바이더 (데모 키)
  manager.addProvider(new TwelveDataProvider());
  
  return manager;
}

// 멀티 프로바이더를 통한 데이터 가져오기
async function fetchMultiProviderQuote(symbol: string, manager: MultiProviderManager) {
  const result = await manager.fetchQuote(symbol);
  
  if (result.data) {
    // Alpha Vantage 형식으로 변환하여 호환성 유지
    const alphaVantageFormat = {
      '05. price': result.data.price.toString(),
      '09. change': result.data.change.toString(),
      '10. change percent': `${result.data.changePercent.toFixed(4)}%`,
      '06. volume': result.data.volume?.toString() || '0'
    };
    
    return {
      data: alphaVantageFormat,
      isRateLimited: false,
      provider: result.provider
    };
  }
  
  return {
    data: null,
    isRateLimited: result.isRateLimited,
    rateLimitMessage: result.rateLimitMessage,
    provider: result.provider
  };
}
```

## 🎨 5. CSS 스타일링 패턴

### Rate Limit Warning 스타일
```css
.rate-limit-warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
}

.indicator-row.rate-limited {
  opacity: 0.6;
  position: relative;
}

.limited-badge {
  background: #fecaca;
  color: #991b1b;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.unavailable-text {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}
```

## 📊 6. 동적 새로고침 간격 설정

```typescript
const getRefreshInterval = () => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const dayOfWeek = easternTime.getDay();
  const hour = easternTime.getHours();
  
  // 주말
  if (dayOfWeek === 0 || dayOfWeek === 6) return 300000; // 5분
  // 장중 (9-16시)
  if (hour >= 9 && hour <= 16) return 60000; // 1분
  // 장외
  return 180000; // 3분
};
```

## 🔧 7. 환경 변수 자동 감지

```typescript
// api-utils.ts에서 환경 변수 우선순위 처리
export function getApiBaseUrl(): string {
  const supabaseFunctionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  const functionsUrl = supabaseFunctionsUrl || 'https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1';
  
  console.log('🔧 Final Supabase Functions URL:', functionsUrl);
  
  return functionsUrl;
}

// edgeFunctionFetcher에서 인증 키 처리
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';
const options: RequestInit = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  },
  body: payload ? JSON.stringify(payload) : undefined,
};
```

## 📝 사용 시 주의사항

1. **타입 안정성**: `edgeFunctionFetcher<T>`에서 T 타입 지정 필수
2. **에러 처리**: try-catch 블록으로 API 호출 감싸기
3. **Rate Limit**: UI에서 사용자에게 적절한 안내 메시지 표시
4. **캐싱**: SWR의 dedupingInterval 활용하여 중복 요청 방지
5. **환경 변수**: development와 production 환경에서 다른 설정 사용

---
**참고**: 이 예시들은 모두 main branch에 실제로 구현되어 있으며, 프로덕션에서 검증된 코드입니다.