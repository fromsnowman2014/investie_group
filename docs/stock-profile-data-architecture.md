# Stock Profile 데이터 아키텍처 문서

## 개요

이 문서는 Investie 플랫폼의 Stock Profile 컴포넌트가 어떻게 데이터를 가져오고, 저장하며, API를 얼마나 자주 호출하는지에 대한 현재 구현 구조를 설명합니다.

## 전체 아키텍처

```
Frontend (Next.js)     ←→     Supabase Edge Function     ←→     Alpha Vantage API
   StockProfile.tsx             stock-data/index.ts              실시간 주식 데이터
```

## 1. 데이터 흐름 구조

### 1.1 프론트엔드 (StockProfile 컴포넌트)

**위치**: `/apps/web/src/app/components/AIAnalysis/StockProfile.tsx`

**데이터 관리 방식**:
- **상태 관리**: React의 `useState` Hook 사용
  - `marketData`: Alpha Vantage에서 받은 실시간 주식 데이터
  - `loading`: 데이터 로딩 상태
  - `error`: 에러 상태

**API 호출 방식**:
```typescript
useEffect(() => {
  edgeFunctionFetcher('stock-data', { symbol })
    .then((result: StockMarketData) => {
      setMarketData(result);
    })
}, [symbol]);
```

**호출 빈도**:
- **심볼 변경 시마다 1회 호출** (`useEffect` 의존성: `[symbol]`)
- 페이지 새로고침 시마다 재호출
- **자동 새로고침 없음** (실시간 업데이트 없이 수동 갱신)

### 1.2 백엔드 (Supabase Edge Function)

**위치**: `/supabase/functions/stock-data/index.ts`

**지원 종목**: 17개 주요 종목
```typescript
const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC',
  'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
];
```

**데이터 소스 우선순위**:
1. **Alpha Vantage API** (실제 데이터)
2. **Mock 데이터** (API 키 없음 또는 Rate Limit 시)

## 2. API 호출 패턴 및 빈도

### 2.1 Alpha Vantage API 사용

**API 키 설정**:
- 환경변수: `ALPHA_VANTAGE_API_KEY`
- Supabase Dashboard → Edge Functions → Environment Variables에서 설정

**병렬 API 호출**:
```typescript
const [quoteResult, overviewResult] = await Promise.allSettled([
  getAlphaVantageQuote(symbol, apiKey),     // 실시간 가격 데이터
  getAlphaVantageOverview(symbol, apiKey),  // 회사 개요 데이터
]);
```

**호출되는 Alpha Vantage 엔드포인트**:
1. **GLOBAL_QUOTE**: 실시간 가격, 변동률, 거래량
2. **OVERVIEW**: 시가총액, PER, 52주 고가/저가

### 2.2 Rate Limit 관리

**Alpha Vantage 무료 계정 제한**:
- **하루 25회 호출 제한**
- 분당 5회 호출 제한

**Rate Limit 감지**:
```typescript
const rateLimitPatterns = [
  'rate limit',
  'API call frequency',
  'calls per day',
  'calls per minute',
  'upgrade your API key'
];
```

**Rate Limit 시 대응**:
- Mock 데이터로 자동 전환
- 사용자에게 Rate Limit 경고 표시
- "내일 다시 시도" 안내 메시지

## 3. 데이터 저장 구조

### 3.1 메모리 저장 (임시)

**프론트엔드 상태**:
```typescript
interface StockMarketData {
  price: number;              // 현재 가격
  change: number;             // 가격 변동
  changePercent: number;      // 변동률 (%)
  volume?: number;            // 거래량
  marketCap?: number;         // 시가총액
  pe?: number;                // PER
  fiftyTwoWeekHigh?: number;  // 52주 고가
  fiftyTwoWeekLow?: number;   // 52주 저가
  source: string;             // 데이터 소스 ('alpha_vantage' | 'mock_data')
  alphaVantageRateLimit?: {   // Rate Limit 정보
    isLimited: boolean;
    message?: string;
    resetTime?: string;
  };
}
```

**저장 방식**:
- **임시 저장**: React 컴포넌트의 state에만 저장
- **영구 저장 없음**: 새로고침 시 데이터 소실
- **캐시 없음**: 매번 API 재호출

### 3.2 Mock 데이터 구조

**사전 정의된 기본 가격**:
```typescript
const MOCK_PRICES: Record<string, number> = {
  AAPL: 182.52,
  TSLA: 245.83,
  MSFT: 378.24,
  // ... 17개 종목
};
```

**Mock 데이터 생성**:
- 기본 가격에 랜덤 변동 적용
- 가상의 PER, 시가총액, 거래량 생성

## 4. 현재 구현의 특징

### 4.1 장점
- ✅ **안정적인 Fallback**: API 장애 시 Mock 데이터로 서비스 유지
- ✅ **Rate Limit 자동 감지**: 무료 API 한계 자동 인식
- ✅ **에러 처리**: 사용자 친화적 에러 메시지
- ✅ **병렬 처리**: 2개 API 동시 호출로 성능 최적화

### 4.2 제한사항
- ❌ **실시간 업데이트 없음**: 수동 새로고침 필요
- ❌ **데이터 캐싱 없음**: 동일 데이터 반복 호출
- ❌ **제한된 종목**: 17개 종목만 지원
- ❌ **하루 25회 제한**: Alpha Vantage 무료 계정 한계

## 5. API 호출 시나리오

### 5.1 정상 케이스
1. 사용자가 AAPL 선택
2. `StockProfile` 컴포넌트 렌더링
3. `useEffect`가 `edgeFunctionFetcher` 호출
4. Supabase Edge Function이 Alpha Vantage 2개 API 병렬 호출
5. 실시간 데이터 반환 및 화면 표시

**API 호출 횟수**: **종목 변경 시마다 2회** (GLOBAL_QUOTE + OVERVIEW)

### 5.2 Rate Limit 케이스
1. 하루 25회 호출 한계 도달
2. Alpha Vantage가 Rate Limit 응답 반환
3. 자동으로 Mock 데이터 생성
4. Rate Limit 경고와 함께 가상 데이터 표시

**사용자 경험**: 서비스 중단 없이 계속 이용 가능

### 5.3 API 키 없음 케이스
1. `ALPHA_VANTAGE_API_KEY` 환경변수 미설정
2. 즉시 Mock 데이터 모드로 동작
3. 모든 데이터가 가상 데이터로 제공

## 6. 개선 권장사항

### 6.1 성능 최적화
- **Redis 캐싱**: 동일 종목 5분간 캐시
- **WebSocket**: 실시간 가격 업데이트
- **백그라운드 갱신**: 정기적 데이터 새로고침

### 6.2 안정성 향상
- **멀티 데이터 소스**: Yahoo Finance, IEX Cloud 추가
- **지능형 Rate Limit**: 시간대별 호출 분산
- **로컬 스토리지**: 임시 데이터 보관

### 6.3 기능 확장
- **더 많은 종목**: API 지원 모든 종목 추가
- **분석 지표**: RSI, MACD 등 기술적 분석
- **히스토리 데이터**: 과거 가격 차트

---

**마지막 업데이트**: 2024년 12월
**문서 버전**: v1.0
**작성자**: Claude Code Analysis