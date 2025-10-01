# Market Indicators Debugging Plan (Direct API 구조)

## 🔍 문제 분석 (Direct API 기반)

### 현재 아키텍처 확인
- **Frontend**: Direct API 호출 방식 (`NEXT_PUBLIC_USE_DIRECT_API=true`)
- **Backend**: Supabase Edge Functions 없음, 모든 API 호출은 Frontend에서 직접 수행
- **데이터 소스**: Yahoo Finance API (CORS 프록시 사용)

### 발견된 핵심 문제들

#### 1. **CORS 프록시 안정성 문제**
```
Access to fetch at 'https://api.allorigins.win/raw?url=...' has been blocked by CORS policy
```
- **현재 프록시**: `api.allorigins.win` 단일 의존
- **문제**: 프로덕션에서 불안정한 CORS 프록시 응답
- **결과**: 일부 Market Indicators 데이터 로드 실패

#### 2. **경제 지표 데이터 하드코딩**
```javascript
// 현재 코드에서 하드코딩된 부분
cpi: {
  value: 2.40, // 하드코딩된 CPI 데이터
  previousValue: 2.50,
  source: 'manual_placeholder_data'
},
unemployment: {
  value: 4.0, // 하드코딩된 실업률 데이터
  source: 'manual_placeholder_data'
}
```

#### 3. **환경 변수 설정 (실제 필요한 것들)**
```javascript
Environment Variables: {
  NODE_ENV: 'production',
  NEXT_PUBLIC_USE_DIRECT_API: true,  // ✅ 설정됨
  NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY: 'demo',  // ⚠️ 데모 키 사용중
  NEXT_PUBLIC_FRED_API_KEY: 'demo'  // ⚠️ 데모 키 사용중
}
```

#### 4. **5개 심볼 호출 상태 확인**
```
🔄 Starting parallel fetch for 5 symbols: ^GSPC, ^VIX, ^IXIC, ^DJI, ^TNX
```
- **현재 상태**: 5개 심볼 호출 코드는 구현되어 있음 ✅
- **^TNX (10Y Treasury)**: Yahoo Finance에서 직접 호출 중

---

## 🚨 우선 순위별 해결 방안 (Direct API 기준)

### Priority 1: CORS 프록시 안정성 개선

#### 1.1 다중 CORS 프록시 시스템 구현
- **현재**: `api.allorigins.win` 단일 프록시 의존
- **개선**: 여러 프록시 서버로 fallback 시스템 구축

```javascript
// 개선된 프록시 목록
const corsProxies = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
  ''  // Direct call as final fallback
];
```

#### 1.2 프록시 응답 시간 모니터링
- **목표**: 각 프록시 응답 시간 측정 및 로깅
- **구현**: 타임아웃 설정 최적화 (현재 10초 → 5초)

### Priority 2: 실제 경제 지표 API 연동

#### 2.1 FRED API 연동 (Federal Reserve Economic Data)
```javascript
// CPI, Unemployment Rate 실제 API 호출
const economicIndicators = {
  cpi: await fetchFredData('CPIAUCSL'),      // Consumer Price Index
  unemployment: await fetchFredData('UNRATE') // Unemployment Rate
};
```

#### 2.2 Vercel 환경 변수 설정 (실제 필요한 것들)
```bash
# Vercel Dashboard에서 설정 필요
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FRED_API_KEY=your-fred-api-key
NEXT_PUBLIC_USE_DIRECT_API=true
```

#### 2.3 환경 변수 검증 스크립트
```javascript
// Direct API 환경에서 실행할 디버깅 코드
console.log('🔍 Direct API Environment Debug:', {
  useDirectApi: process.env.NEXT_PUBLIC_USE_DIRECT_API,
  hasAlphaVantageKey: !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
  hasFredKey: !!process.env.NEXT_PUBLIC_FRED_API_KEY,
  nodeEnv: process.env.NODE_ENV
});
```

### Priority 3: 에러 처리 및 사용자 경험 개선

#### 3.1 지능적 Fallback 시스템
```javascript
// API 실패시 단계별 fallback
const dataFallbackChain = [
  () => fetchYahooFinanceData(symbol),     // Primary: Yahoo Finance
  () => fetchAlphaVantageData(symbol),     // Secondary: Alpha Vantage
  () => getLastKnownValue(symbol),         // Tertiary: Cached data
  () => getMockData(symbol)                // Final: Mock data with warning
];
```

#### 3.2 실시간 에러 모니터링
```javascript
// 프로덕션에서 에러 추적
const trackApiError = (error, symbol, proxyUsed) => {
  console.error(`📊 API Error tracked:`, {
    symbol,
    error: error.message,
    proxy: proxyUsed,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};
```

---

## 🔧 즉시 실행 가능한 디버깅 단계 (Direct API 기준)

### Step 1: CORS 프록시 안정성 테스트
```javascript
// 브라우저 콘솔에서 각 프록시 테스트
const testProxies = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

testProxies.forEach(async (proxy, index) => {
  try {
    const url = proxy + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/^GSPC');
    const response = await fetch(url);
    console.log(`✅ Proxy ${index + 1} (${proxy}): ${response.status}`);
  } catch (error) {
    console.error(`❌ Proxy ${index + 1} (${proxy}): ${error.message}`);
  }
});
```

### Step 2: 환경 변수 검증 (Direct API 용)
1. Vercel Dashboard → Settings → Environment Variables 확인
2. 필요한 환경 변수들:
   - `NEXT_PUBLIC_USE_DIRECT_API=true`
   - `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your-key`
   - `NEXT_PUBLIC_FRED_API_KEY=your-key`

### Step 3: 실시간 Market Data 디버깅
```javascript
// 브라우저 콘솔에서 실행할 Direct API 디버깅 코드
console.log('🔍 Direct API Real-time Debug:', {
  useDirectApi: process.env.NEXT_PUBLIC_USE_DIRECT_API,
  hasAlphaVantageKey: !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY,
  hasFredKey: !!process.env.NEXT_PUBLIC_FRED_API_KEY,
  currentDomain: window.location.origin,
  userAgent: navigator.userAgent,
  online: navigator.onLine
});

// 수동으로 Yahoo Finance API 테스트
fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/^TNX'))
  .then(response => response.json())
  .then(data => console.log('🔍 ^TNX Direct Test:', data))
  .catch(error => console.error('❌ ^TNX Test Failed:', error));
```

---

## 📊 예상 해결 시간 (Direct API 기준)

| 문제 | 예상 해결 시간 | 우선순위 |
|------|----------------|----------|
| CORS 프록시 안정성 개선 | 30분 | 🔴 Critical |
| 경제 지표 API 연동 (FRED) | 45분 | 🔴 Critical |
| 환경 변수 설정 | 10분 | 🟡 Medium |
| 에러 처리 개선 | 20분 | 🟢 Low |

---

## ✅ 성공 기준 (Direct API 기준)

### 즉시 확인 가능한 지표
1. **콘솔 로그 변화**:
   ```
   ✅ 🔄 Starting parallel fetch for 5 symbols: ^GSPC, ^VIX, ^IXIC, ^DJI, ^TNX
   ✅ Direct API Environment Debug: useDirectApi: true, hasAlphaVantageKey: true
   ✅ ✅ Direct API: Successfully fetched ^TNX data via corsproxy.io
   ```

2. **UI 변화**:
   - 10Y Treasury: "No data available" → "4.15%" (실제 Yahoo Finance 데이터)
   - CPI: "2.40%" → 실제 FRED API 데이터
   - Unemployment: "4.0%" → 실제 FRED API 데이터

3. **API 응답 시간 및 안정성**:
   - 현재: ~8초 (단일 CORS 프록시 실패시 지연)
   - 목표: ~3초 이하 (다중 프록시 fallback)
   - 성공률: 현재 60% → 목표 95%

---

## 🔄 지속적 모니터링 계획

### 프로덕션 모니터링 도구
1. **Vercel Analytics**: 배포 상태 모니터링
2. **Browser DevTools**: 실시간 API 호출 모니터링
3. **Custom Logging**: 주요 API 호출에 대한 성능 로깅

### 알림 시스템
```javascript
// 프로덕션에서 경제 지표 데이터 로드 실패시 알림
if (!economicIndicators?.interestRate && process.env.NODE_ENV === 'production') {
  console.error('🚨 Production Alert: Treasury data failed to load');
  // 필요시 외부 모니터링 서비스로 알림 전송
}
```

---

## 📝 장기 개선 방안

### 1. API 안정성 향상
- Multiple CORS proxy failover system
- Rate limiting 및 retry logic 개선
- Real-time economic data API (Alpha Vantage, FRED) 통합

### 2. 성능 최적화
- API 응답 캐싱 (5분 간격)
- 병렬 요청 최적화
- CDN 활용한 static data caching

### 3. 모니터링 강화
- Real-time error tracking (Sentry 등)
- Performance monitoring (Vercel Analytics)
- API uptime monitoring

---

## 🎯 Next Steps

1. **즉시 실행**: Vercel 재배포 및 환경 변수 확인
2. **30분 내**: CORS 프록시 개선 코드 배포
3. **1시간 내**: 프로덕션 환경에서 모든 경제 지표 정상 작동 확인
4. **24시간 내**: 모니터링 시스템 구축 및 문서화