# Enhanced Market Intelligence 디버깅 가이드

## 📋 개요

이 문서는 Enhanced Market Intelligence 대시보드의 일반적인 문제들과 해결 방법을 정리합니다.

## 🔍 주요 문제 사례

### 1. "Invalid Date" 표시 문제

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

### 2. 무한 로딩 상태 (Loading...)

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

### 3. API 환경변수 미설정

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

## 🛠️ 디버깅 절차

### Step 1: API 응답 확인
```bash
# Backend API 직접 테스트
curl -s https://investiegroup-production.up.railway.app/api/v1/market/enhanced-summary | jq '.'
```

예상 응답 구조:
```json
{
  "success": true,
  "data": {
    "fearGreedIndex": {...},
    "economicIndicators": {...},
    "sp500Sparkline": {...},
    "sectors": {...},
    "lastUpdated": "2025-08-25T05:02:39.167Z"
  },
  "source": "enhanced-market-service",
  "timestamp": "2025-08-25T05:02:39.167Z"
}
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

## 🚀 배포 체크리스트

- [ ] API 환경변수 설정 확인
- [ ] Backend API 엔드포인트 동작 확인
- [ ] 개발 모드에서 정상 작동 테스트
- [ ] 빌드 성공 확인
- [ ] 타입 체크 통과 확인
- [ ] 배포 후 실제 데이터 표시 확인

---

**작성일:** 2025-08-25  
**최종 업데이트:** 2025-08-25  
**작성자:** Claude Code Assistant