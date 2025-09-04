# Enhanced Market Intelligence 실시간 데이터 디버깅 가이드

## 📋 개요

이 문서는 Enhanced Market Intelligence 대시보드의 실시간 데이터 시스템 문제들과 해결 방법을 정리합니다. 특히 SPY 데이터 정확성과 실시간 업데이트 기능에 중점을 둡니다.

## 🔍 주요 문제 사례

### 1. SPY 가격 부정확성 (Critical Issue)

**증상:**
```
S&P 500: $4178.80 (실제 시장가와 대폭 차이)
오래된 Mock 데이터 표시
```

**원인:**
- Alpha Vantage API 키가 "demo"로 설정되어 실제 데이터 없음
- Yahoo Finance 백업이 작동하지 않음
- 캐시 TTL이 12시간으로 설정되어 오래된 데이터 사용

**해결 방법:**
```bash
# 1. API 키 확인
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=demo"

# 2. Yahoo Finance 백업 테스트
curl "https://query1.finance.yahoo.com/v8/finance/chart/SPY"

# 3. 캐시 상태 확인
curl "http://localhost:3001/api/v1/market/update-status"
```

**실시간 검증:**
```typescript
// Yahoo Finance를 통한 가격 검증
const validation = await this.marketService.validateSPYPrice(currentPrice);
if (!validation.isValid) {
  console.warn(`SPY 가격 검증 실패: ${currentPrice} vs ${validation.actualPrice}`);
}
```

### 2. "Invalid Date" 표시 문제

**증상:**
```
Last updated: Invalid Date
```

**원인:**
- `data.lastUpdated` 필드가 undefined 또는 null
- 날짜 형식이 JavaScript Date 객체가 인식할 수 없는 형태

**해결 방법:**
```typescript
// ❌ 위험한 코드
new Date(data.lastUpdated).toLocaleString()

// ✅ 안전한 코드
data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'
```

### 3. 무한 로딩 상태 (Loading...)

**증상:**
- Enhanced Market Intelligence 헤더는 표시됨
- 모든 하위 컴포넌트가 "Loading..." 상태로 고정

**원인:**
- API 응답 구조와 프론트엔드 기대값 불일치
- Backend: `{ success: true, data: {...} }`
- Frontend 기대: `{...}` 직접 접근

**진단 방법:**
```typescript
// 개발 모드에서 콘솔 확인
console.log('📊 Enhanced Market API Response:', apiResponse);
console.log('📦 API Response Structure:', Object.keys(apiResponse));
```

**해결 방법:**
```typescript
const fetcher = async (url: string): Promise<EnhancedMarketSummary> => {
  const response = await fetch(url);
  const apiResponse = await response.json();
  
  // API 응답에서 실제 데이터 추출
  if (apiResponse.success && apiResponse.data) {
    return apiResponse.data; // ✅ 올바른 데이터 반환
  }
  
  throw new Error('Invalid API response structure');
};
```

### 4. 실시간 데이터 업데이트 지연

**증상:**
```
데이터가 15분 이상 업데이트되지 않음
Market Hours 중에도 오래된 데이터 표시
Red indicator (🔴) 표시
```

**원인:**
- 스케줄러의 intraday 업데이트가 작동하지 않음
- 캐시 TTL이 너무 길게 설정됨
- API 호출 제한에 걸림

**해결 방법:**
```bash
# 1. 스케줄러 상태 확인
curl "http://localhost:3001/api/v1/market/update-status"

# 2. 수동 업데이트 트리거
curl -X POST "http://localhost:3001/api/v1/market/force-update"

# 3. 로그 확인
docker logs <container_id> | grep "intraday-market-update"
```

### 5. 데이터 소스 백업 실패

**증상:**
```
Source badge shows "Unknown" or "Cache"
Yahoo Finance backup not working
```

**진단:**
```bash
# Yahoo Finance 직접 테스트
curl -H "User-Agent: Mozilla/5.0" "https://query1.finance.yahoo.com/v8/finance/chart/SPY"

# 응답 확인 (정상적인 경우)
{
  "chart": {
    "result": [{
      "meta": {
        "regularMarketPrice": 570.25,
        "previousClose": 568.98
      }
    }]
  }
}
```

### 6. API 환경변수 미설정

**증상:**
```
Configuration Error
API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.
```

**해결 방법:**
```bash
# .env.local 파일에 추가
NEXT_PUBLIC_API_URL=https://investiegroup-production.up.railway.app
```

## 🛠️ 실시간 데이터 디버깅 절차

### Step 1: 실시간 데이터 검증
```bash
# 1. Yahoo Finance에서 현재 SPY 가격 확인
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/v8/finance/chart/SPY" | \
  jq '.chart.result[0].meta.regularMarketPrice'

# 2. Backend API 응답과 비교
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | \
  jq '.data.sp500Sparkline.currentPrice'

# 3. 가격 검증 정보 확인
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | \
  jq '.data.priceValidation'
```

### Step 2: 데이터 신선도 확인
```bash
# 1. 마지막 업데이트 시간 확인
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | \
  jq '.data.lastUpdated'

# 2. 현재 시간과 비교 (분 단위)
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | \
  jq -r '.data.lastUpdated' | xargs -I {} date -d {} +%s | \
  awk '{print (systime() - $1) / 60 " minutes ago"}'

# 3. 데이터 소스 확인
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | \
  jq '.data.sp500Sparkline.source'
```

### Step 3: 스케줄러 상태 확인
```bash
# 1. 업데이트 상태 확인
curl -s http://localhost:3001/api/v1/market/update-status | jq '.'

# 예상 응답:
{
  "success": true,
  "data": {
    "lastUpdate": "2024-08-27T14:30:00Z",
    "nextUpdate": "2024-08-27T14:45:00Z",
    "cacheStats": {...},
    "isUpdateRequired": false
  }
}

# 2. 수동 업데이트 강제 실행
curl -X POST http://localhost:3001/api/v1/market/force-update

# 3. 로그에서 스케줄러 작동 확인
tail -f logs/application.log | grep -E "(market-open-update|intraday-market-update|market-close-update)"
```

### Step 2: 프론트엔드 데이터 확인
```typescript
// EnhancedMacroIndicatorsDashboard.tsx에서
const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
  fullApiUrl,
  fetcher
);

// 개발 모드에서 콘솔 확인
if (process.env.NODE_ENV === 'development') {
  console.log('SWR Data:', data);
  console.log('SWR Error:', error);
  console.log('SWR Loading:', isLoading);
}
```

### Step 3: 개별 컴포넌트 데이터 확인
```typescript
// 각 컴포넌트가 받는 데이터 확인
<FearGreedGauge 
  data={data.fearGreedIndex}  // undefined 여부 확인
  isLoading={isLoading} 
/>
```

## ⚡ 성능 최적화

### 캐시 정보 표시
```typescript
{data.cacheInfo && (
  <div className="cache-performance">
    <span>Cache Hit: {(data.cacheInfo.hitRate * 100).toFixed(1)}%</span>
    <span>Avg Response: {data.cacheInfo.averageResponseTime}ms</span>
  </div>
)}
```

### SWR 설정 최적화
```typescript
const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
  fullApiUrl,
  fetcher,
  {
    refreshInterval: 60000,      // 1분마다 갱신
    revalidateOnFocus: true,     // 탭 포커스시 갱신
    revalidateOnReconnect: true, // 재연결시 갱신
    errorRetryCount: 3,          // 3회 재시도
    errorRetryInterval: 5000,    // 5초 간격
  }
);
```

## 🔧 일반적인 해결책

### 1. 컴포넌트 조건부 렌더링
```typescript
// ❌ 위험한 패턴
if (isLoading || !data) {
  return <LoadingState />;
}

// ✅ 더 정확한 패턴
if (isLoading) {
  return <LoadingState />;
}

if (error) {
  return <ErrorState error={error} />;
}

if (!data) {
  return <EmptyState />;
}
```

### 2. 타입 안전성 보장
```typescript
interface EnhancedMarketSummary {
  fearGreedIndex: FearGreedIndexData | null;
  economicIndicators: EconomicIndicatorsData | null;
  sp500Sparkline: SP500Data | null;
  sectors: SectorData[] | null;
  lastUpdated: string;
  cacheInfo?: CacheInfo; // Optional 필드
}
```

### 3. 에러 경계 추가
```typescript
const fetcher = async (url: string): Promise<EnhancedMarketSummary> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const apiResponse = await response.json();
    
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error('Invalid API response structure');
    }
    
    return apiResponse.data;
  } catch (error) {
    console.error('Enhanced Market API Error:', error);
    throw error;
  }
};
```

## 📊 모니터링

### 개발자 도구 활용
1. **네트워크 탭**: API 요청/응답 확인
2. **콘솔 탭**: 개발 모드 로그 확인
3. **React DevTools**: SWR 상태 확인

### 프로덕션 모니터링
- API 응답 시간 추적
- 캐시 적중률 모니터링
- 에러율 추적

## 🚀 실시간 데이터 시스템 배포 체크리스트

### 🔧 개발 환경 테스트
- [ ] **API 키 설정**: Alpha Vantage API 키가 "demo"가 아닌 실제 키로 설정
- [ ] **Yahoo Finance 백업**: Demo API 키 상태에서도 Yahoo Finance 데이터 정상 작동
- [ ] **가격 검증**: 실시간 가격과 API 응답 가격이 2% 이내 일치
- [ ] **캐시 TTL**: SP500 데이터 15분, VIX 데이터 15분으로 설정 확인
- [ ] **스케줄러**: Intraday 15분 업데이트 작동 확인

### 📊 데이터 정확성 검증
- [ ] **SPY 가격**: 현재 시장가와 1% 이내 일치
- [ ] **데이터 신선도**: Market hours 중 5분 이내, After hours 15분 이내
- [ ] **프라이스 밸리데이션**: 부정확한 가격 감지 시 자동 교정
- [ ] **소스 표시**: 정확한 데이터 소스 (Yahoo/Alpha Vantage) 표시
- [ ] **타임스탬프**: 올바른 업데이트 시간 표시

### 🔄 실시간 업데이트 테스트
- [ ] **Market Open**: 9:30 AM EST 정시 업데이트
- [ ] **Intraday**: 15분마다 SP500/VIX 업데이트 (Market Hours Only)
- [ ] **Market Close**: 4:00 PM EST 정시 업데이트
- [ ] **Frontend Polling**: Market hours 30초, After hours 3분 간격
- [ ] **수동 업데이트**: Force update API 정상 작동

### 🎯 UI/UX 검증
- [ ] **신선도 표시**: Green (5분), Yellow (15분), Red (1시간) 정상 표시
- [ ] **마켓 상태**: Market Open/Closed 정확한 표시
- [ ] **데이터 소스 배지**: Yahoo/Alpha Vantage 소스 표시
- [ ] **반응형**: 모바일에서 데이터 상태 섹션 정상 표시
- [ ] **로딩 상태**: 데이터 업데이트 중 적절한 로딩 표시

### 🛡️ 오류 처리 테스트
- [ ] **API 실패**: 모든 API 실패 시 적절한 fallback
- [ ] **네트워크 오류**: 네트워크 오류 시 재시도 로직
- [ ] **잘못된 데이터**: 비정상적인 가격 데이터 검증 및 교정
- [ ] **타임아웃**: API 타임아웃 시 적절한 에러 메시지
- [ ] **캐시 실패**: 캐시 서비스 실패 시에도 데이터 표시

### 🔍 모니터링 및 로깅
- [ ] **가격 검증 로그**: 부정확한 가격 감지 시 경고 로그
- [ ] **업데이트 로그**: 각 스케줄 업데이트 성공/실패 로그
- [ ] **백업 소스 로그**: Yahoo Finance 백업 사용 시 로그
- [ ] **성능 메트릭**: API 응답 시간 및 캐시 히트율
- [ ] **에러 추적**: 모든 오류 상황에 대한 적절한 로깅

---

**작성일:** 2025-08-25  
**최종 업데이트:** 2025-08-27 (실시간 데이터 시스템 구현)  
**작성자:** Claude Code Assistant  
**버전:** 2.0 - Real-time Data System