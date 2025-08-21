# Investie Frontend 실제 백엔드 연동 개발 가이드 (Direct Integration)

## 🎯 프로젝트 현황 및 목표

### ✅ 현재 백엔드 인프라 상태 (Production Ready!)
백엔드 시스템이 이미 Railway와 Supabase에 완전히 배포되어 있으며, 실제 API 연동이 가능합니다:

1. **뉴스 & AI 분석 API** ✅ - SerpAPI + Claude AI 완전 구현
2. **Supabase 데이터베이스** ✅ - 5개 테이블 스키마 배포 완료
3. **Railway 배포** ✅ - 프로덕션 환경에서 API 서비스 중
4. **API 엔드포인트** ✅ - 모든 필요한 API 경로 구현 완료

### 🎯 개발 목표 (Mock Data 완전 제거)
처음부터 실제 백엔드 API와 직접 연동하여 4개 핵심 컴포넌트를 개발합니다. Mock 데이터는 사용하지 않습니다.

### 📊 Frontend Architecture (실제 API 직접 연동)
- **SWR 기반 실시간 데이터 페칭**: Railway 백엔드 직접 연동
- **TypeScript 완전 지원**: 백엔드 API 응답 타입 정의
- **반응형 디자인**: 모바일/데스크톱 호환
- **실제 데이터 에러 처리**: API 실패, 네트워크 오류, 데이터 부재 처리
- **성능 최적화**: 실제 API 응답 시간에 최적화된 refresh intervals

---

## 📊 Railway 배포된 Backend API 엔드포인트 (즉시 사용 가능)

### ✅ Railway에 배포된 실제 API 엔드포인트

#### 1. 뉴스 & AI 분석 API (완전 구현됨)
- **`/api/v1/news/:symbol`** ✅ SerpAPI + Claude AI 실시간 분석
- **`/api/v1/news/process`** ✅ POST 요청으로 특정 종목 뉴스 처리
- **`/api/v1/news/macro/today`** ✅ 일일 매크로 경제 뉴스
- **데이터 소스**: 실제 Google News + Claude AI 분석
- **응답 구조**:
```typescript
// News API Response (실제 SerpAPI + Claude AI 결과)
{
  symbol: string;
  stockNews: {
    headline: string;        // Claude AI 생성 헤드라인
    articles: NewsArticle[];
    totalArticles: number;
    query: string;
    fetchedAt: string;
  };
  macroNews: {
    topHeadline: string;     // Claude AI 생성 매크로 헤드라인
    articles: NewsArticle[];
    totalArticles: number;
    query: string;
    fetchedAt: string;
  };
  overview: {
    overview: string;        // Claude AI 투자 분석
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
  };
  cached: boolean;
  fromFile: boolean;
}
```

#### 2. 주식 데이터 API (개발 진행 중)
- **`/api/v1/stocks/:symbol`** ⚠️ Alpha Vantage 연동 (진행 중)
- **`/api/v1/stocks`** ⚠️ 전체 종목 리스트
- **데이터 소스**: Alpha Vantage API (실제 주식 가격)

#### 3. 시장 지표 API (개발 진행 중)
- **`/api/v1/market/overview`** ⚠️ Alpha Vantage 연동 (진행 중)
- **`/api/v1/market/movers`** ⚠️ 상승/하락 종목
- **데이터 소스**: Alpha Vantage API (실제 시장 데이터)

#### 4. Dashboard 통합 API (계획됨)
- **`/api/v1/dashboard/:symbol`** 📋 모든 데이터 통합 엔드포인트
- **구성**: 뉴스 분석 + 주식 데이터 + 시장 지표 통합

---

## 🔧 컴포넌트별 개발 명세서

### 📈 1. Stock Profile Component (실제 API 연동)

#### 기능 개요
선택된 종목의 기본 정보, 실시간 가격, 주요 지표를 표시하는 프로필 카드

#### 데이터 소스
- **Primary API**: `/api/v1/stocks/:symbol` (Railway 배포)
- **Fallback Strategy**: 네트워크 에러 시 이전 캐시 데이터 표시
- **Update Frequency**: 5분마다 (Alpha Vantage API 제한 고려)

#### 표시 정보
1. **회사 기본 정보**
   - 회사명, 심볼, 섹터, 국가
   - 설명 (description)

2. **핵심 지표**
   - 시가총액 (Market Cap)
   - P/E 비율
   - 배당 수익률
   - 현재가 및 변동률

3. **회사 세부 정보**
   - 직원 수, 설립연도
   - 본사 위치, 웹사이트

#### 기술 구현
```typescript
interface StockProfileData {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  description: string;
  employees: number;
  founded: string;
  headquarters: string;
  website: string;
}
```

#### UI/UX 설계
- **레이아웃**: 상단 회사 정보 + 중간 핵심 지표 카드 + 하단 상세 정보
- **반응형**: 모바일에서 지표 카드 세로 배열
- **상태 관리**: Loading, Error, Empty 상태 처리
- **시각적 요소**: 가격 변동에 따른 색상 구분 (상승/하락)

#### 개발 우선순위
1. **Phase 1**: 기본 AI 분석 표시 UI
2. **Phase 2**: API 연동 및 실시간 데이터
3. **Phase 3**: 추가 지표 및 차트 연동

### 🤖 2. AI Investment Opinion Component (Claude AI 직접 연동)

#### 기능 개요
Claude AI가 실시간 뉴스를 분석한 투자 의견, 추천 등급, 핵심 포인트를 표시

#### 데이터 소스
- **Primary API**: `/api/v1/news/:symbol` → overview 섹션 (Claude AI 분석)
- **실제 데이터**: SerpAPI 뉴스 + Claude AI 분석 결과
- **Update Frequency**: 15분마다 (Claude API 비용 고려)
- **Fallback Strategy**: API 실패 시 "분석 중" 상태 표시

#### 표시 정보
1. **AI 추천 헤더**
   - BUY/HOLD/SELL 배지
   - 신뢰도 스코어 (0-100%)
   - 분석 일자 및 기간

2. **투자 등급**
   - 1-10 점수 (시각적 바)
   - 등급 설명 (Excellent/Good/Fair/Poor)

3. **분석 내용**
   - 핵심 포인트 (Key Points)
   - 기회 요인 (Opportunities)
   - 위험 요인 (Risks)

4. **AI 면책조항**
   - 투자 조언 아님 경고문

#### 기술 구현
```typescript
interface AIAnalysisData {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;              // 0-100
  analysisText: string;           // AI 생성 분석 텍스트
  keyFactors: string[];           // 핵심 투자 요인
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;            // "3-6 months"
  investmentRating: number;       // 1-10 (계산된 값)
  analysisDate: string;
  opportunities: string[];        // keyFactors에서 추출
  risks: string[];               // riskLevel 기반 생성
}
```

#### UI/UX 설계
- **레이아웃**: 추천 헤더 + 등급 바 + 3단 분석 섹션
- **색상 시스템**: BUY(녹색), HOLD(주황), SELL(빨강)
- **아이콘**: 이모지 기반 시각적 구분
- **애니메이션**: 등급 바 progressbar 효과

#### 개발 우선순위
1. **Phase 1**: 기본 AI 분석 표시 UI
2. **Phase 2**: `/api/v1/news/:symbol` 연동
3. **Phase 3**: 고급 분석 및 히스토리 기능

### 📊 3. Macro Indicators Component (실제 시장 데이터)

#### 기능 개요
주요 경제 지표와 시장 지수를 실시간으로 표시하는 매크로 대시보드

#### 데이터 소스
- **Primary API**: `/api/v1/market/overview` (Alpha Vantage 연동)
- **실제 데이터**: S&P 500, NASDAQ, DOW 실시간 지수
- **Update Frequency**: 5분마다 (시장 개방 시간 동안)
- **시장 폐장 시**: 이전 장 마감 데이터 유지

#### 표시 정보
1. **주요 지수** (실시간)
   - S&P 500, NASDAQ, DOW
   - 현재값, 변동, 변동률

2. **섹터 성과**
   - Technology, Healthcare, Energy, Financial
   - 성과 색상 구분

3. **시장 지표**
   - 시장 센티먼트 (Bullish/Bearish/Neutral)
   - VIX 변동성 지수
   - Fear & Greed Index (계산)

4. **경제 지표** (확장 계획)
   - 금리, 인플레이션, 실업률
   - GDP 성장률, 소비자 신뢰지수

#### 기술 구현
```typescript
interface MacroIndicatorsData {
  indices: {
    sp500: MarketIndex;
    nasdaq: MarketIndex;
    dow: MarketIndex;
  };
  sectors: SectorPerformance[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityIndex: number;        // VIX
  fearGreedIndex?: number;        // 0-100 (계산)
  economicIndicators?: {
    interestRate: number;
    inflation: number;
    unemployment: number;
  };
}

interface MarketIndex {
  value: number;
  change: number;
  changePercent: number;
  volume?: number;
}

interface SectorPerformance {
  name: string;
  change: number;
  performance: 'positive' | 'negative';
  stocks?: string[];              // 대표 종목들
}
```

#### UI/UX 설계
- **레이아웃**: 2x2 그리드 (지수 | 섹터 | 센티먼트 | 지표)
- **색상 코딩**: 상승(녹색), 하락(빨강), 중립(회색)
- **실시간 업데이트**: Smooth transition 애니메이션
- **반응형**: 모바일에서 세로 스택

#### 개발 우선순위
1. **Phase 1**: 기본 지수 및 섹터 표시
2. **Phase 2**: `/api/v1/market/overview` 연동
3. **Phase 3**: 고급 경제 지표 추가

### 📰 4. AI News Analysis Component (실시간 뉴스 + AI 분석)

#### 기능 개요
SerpAPI로 실시간 수집된 뉴스를 Claude AI가 분석한 결과를 표시하는 뉴스 분석 패널

#### 데이터 소스
- **Primary API**: `/api/v1/news/:symbol` (SerpAPI + Claude AI)
- **실제 데이터**: Google News 실시간 뉴스 + Claude AI 센티먼트 분석
- **Update Frequency**: 15분마다 (뉴스 업데이트 주기)
- **캐싱 전략**: 백엔드에서 JSON 파일로 캐싱, 최신 데이터 우선 표시

#### 표시 정보
1. **종목 뉴스 분석**
   - AI 생성 헤드라인
   - 뉴스 기사 수 (totalArticles)
   - 뉴스 기반 센티먼트 분석

2. **매크로 뉴스**
   - 주요 경제 뉴스 헤드라인
   - 시장 영향도 분석
   - 관련 섹터 영향

3. **뉴스 인사이트** (AI 생성)
   - 종목에 미치는 영향 분석
   - 단기/장기 전망
   - 경쟁사 비교 (확장)

4. **뉴스 시간정보**
   - 마지막 업데이트 시간
   - 뉴스 날짜 범위

#### 기술 구현
```typescript
interface AINewsAnalysisData {
  symbol: string;
  stockNews: {
    headline: string;
    articles: NewsArticle[];
    totalArticles: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    fetchedAt: string;
    dateRange?: { oldest: string; newest: string; };
  };
  macroNews: {
    topHeadline: string;
    articles: NewsArticle[];
    totalArticles: number;
    marketImpact: string;          // AI 분석
    affectedSectors: string[];
    fetchedAt: string;
  };
  aiInsights: {
    stockImpact: string;           // AI 생성
    shortTermOutlook: string;
    longTermOutlook: string;
    competitorComparison?: string;
  };
}

interface NewsArticle {
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
}
```

#### UI/UX 설계
- **레이아웃**: 상단 종목 뉴스 + 하단 매크로 뉴스
- **빈 데이터 처리**: "분석 중" 메시지로 우아한 로딩
- **확장 가능**: 클릭 시 전체 기사 목록 모달
- **시간 표시**: "15분 전 업데이트" 상대 시간

#### 개발 우선순위
1. **Phase 1**: 헤드라인 기반 기본 UI
2. **Phase 2**: `/api/v1/news/:symbol` 연동
3. **Phase 3**: AI 인사이트 및 심화 분석

---

## 🔄 실제 API 연동 데이터 훅 설계

### Railway 백엔드 직접 연동 훅
```typescript
// useRealAPIData.ts - 실제 백엔드 API 전용 훅

// Railway 백엔드 BASE URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-railway-url.railway.app';

export const useStockProfileData = (symbol: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    symbol ? `/api/v1/stocks/${symbol}` : null,
    fetcher,
    { 
      refreshInterval: 300000, // 5분 (Alpha Vantage API 제한)
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );
  
  return {
    profileData: data,
    isLoading,
    error,
    isEmpty: !data && !isLoading && !error,
    refetch: mutate,
    lastUpdated: data?.timestamp
  };
};

export const useAIInvestmentData = (symbol: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    symbol ? `/api/v1/news/${symbol}` : null,
    fetcher,
    { 
      refreshInterval: 900000, // 15분 (Claude API 비용 고려)
      revalidateOnFocus: false,
      errorRetryCount: 2,
      errorRetryInterval: 10000
    }
  );
  
  return {
    aiAnalysis: data?.overview,
    isLoading,
    error,
    confidence: data?.overview?.confidence || 0,
    isAnalyzing: isLoading && !data,
    hasAnalysis: !!data?.overview,
    refetch: mutate,
    lastUpdated: data?.fetchedAt
  };
};

export const useMacroIndicatorsData = () => {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/market/overview',
    fetcher,
    { 
      refreshInterval: 300000, // 5분 (시장 데이터 업데이트)
      revalidateOnFocus: false,
      errorRetryCount: 3,
      // 시장 시간 외에는 업데이트 중지
      refreshWhenHidden: false
    }
  );
  
  return {
    marketData: data,
    isLoading,
    error,
    isEmpty: !data && !isLoading && !error,
    isMarketOpen: checkMarketHours(),
    refetch: mutate,
    lastUpdated: data?.timestamp
  };
};

export const useNewsAnalysisData = (symbol: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    symbol ? `/api/v1/news/${symbol}` : null,
    fetcher,
    { 
      refreshInterval: 900000, // 15분 (뉴스 업데이트 주기)
      revalidateOnFocus: false,
      errorRetryCount: 2,
      dedupingInterval: 300000 // 5분간 중복 요청 방지
    }
  );
  
  return {
    stockNews: data?.stockNews,
    macroNews: data?.macroNews,
    hasStockNews: !!data?.stockNews?.articles?.length,
    hasMacroNews: !!data?.macroNews?.articles?.length,
    isLoading,
    error,
    isCached: data?.cached || false,
    isFromFile: data?.fromFile || false,
    refetch: mutate,
    lastFetched: data?.stockNews?.fetchedAt
  };
};
```

### 실제 API 에러 처리 전략
```typescript
// RealAPIErrorBoundary.tsx - 실제 API 연동 에러 처리

export const APIErrorBoundary = ({ 
  children, 
  componentName, 
  apiEndpoint 
}: {
  children: React.ReactNode;
  componentName: string;
  apiEndpoint: string;
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <APIErrorFallback 
          error={error}
          componentName={componentName}
          apiEndpoint={apiEndpoint}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// API 에러 폴백 컴포넌트
const APIErrorFallback = ({ error, componentName, apiEndpoint, onRetry }) => (
  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
    <h3 className="text-red-800 font-medium">{componentName} API 연결 실패</h3>
    <p className="text-red-600 text-sm mt-1">엔드포인트: {apiEndpoint}</p>
    <p className="text-red-600 text-sm mt-1">에러: {error.message}</p>
    <button 
      onClick={onRetry}
      className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      다시 시도
    </button>
  </div>
);

// 컴포넌트별 사용 예시 (Mock 데이터 제거)
<APIErrorBoundary 
  componentName="Stock Profile" 
  apiEndpoint="/api/v1/stocks/:symbol"
>
  <StockProfile symbol={symbol} />
</APIErrorBoundary>
```

### 실제 API 응답 타입 정의
```typescript
// types/api.ts - 실제 백엔드 API 응답 타입

// Railway 백엔드 뉴스 API 응답
export interface NewsAPIResponse {
  symbol: string;
  stockNews: {
    headline: string;
    articles: NewsArticle[];
    totalArticles: number;
    query: string;
    fetchedAt: string;
  };
  macroNews: {
    topHeadline: string;
    articles: NewsArticle[];
    totalArticles: number;
    query: string;
    fetchedAt: string;
  };
  overview: {
    overview: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
  };
  cached: boolean;
  fromFile: boolean;
}

// Alpha Vantage 주식 API 응답 (예상)
export interface StockAPIResponse {
  symbol: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  sector: string;
  lastUpdated: string;
}

// 시장 지표 API 응답 (예상)
export interface MarketAPIResponse {
  indices: {
    sp500: MarketIndex;
    nasdaq: MarketIndex;
    dow: MarketIndex;
  };
  sectors: SectorPerformance[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityIndex: number;
  lastUpdated: string;
}

export interface NewsArticle {
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
}
```

---

## 📋 실제 백엔드 연동 개발 로드맵

### ✅ Phase 0: 백엔드 인프라 준비 완료 (이미 완료!)
**Railway + Supabase 인프라가 이미 완전히 준비됨**

1. **뉴스 & AI 분석 시스템** ✅
   - SerpAPI + Claude AI 완전 구현 및 Railway 배포
   - `/api/v1/news/:symbol` 엔드포인트 운영 중
   - Supabase 데이터베이스 스키마 배포 완료
   - 실제 Google News + Claude AI 분석 결과 제공

2. **API 엔드포인트** ✅
   - 모든 필요한 API 경로 구현 완료
   - Railway 프로덕션 환경에서 서비스 중
   - Supabase 연결 및 헬스체크 완료
   - Circuit breaker 및 에러 처리 시스템 완비

### 🚀 Phase 1: 실제 API 직접 연동 개발 (즉시 시작)
**Mock 데이터 없이 처음부터 실제 백엔드와 연동하여 개발**

**Week 1: AI 뉴스 분석 컴포넌트 (가장 완성도가 높은 API부터)**
1. **AINewsAnalysisReport 컴포넌트 개발**
   - `/api/v1/news/:symbol` 직접 연동
   - SerpAPI + Claude AI 실시간 데이터 표시
   - 실제 뉴스 기사 및 AI 분석 결과 UI 구현

2. **AIInvestmentOpinion 컴포넌트 개발**
   - 동일한 `/api/v1/news/:symbol` API의 overview 섹션 사용
   - Claude AI 투자 추천 (BUY/HOLD/SELL) 실시간 표시
   - 신뢰도 스코어 및 리스크 레벨 UI 구현

**Week 2: 주식 데이터 컴포넌트 (Alpha Vantage API 연동)**
3. **StockProfile 컴포넌트 개발**
   - `/api/v1/stocks/:symbol` 연동 (Alpha Vantage 기반)
   - 실제 주식 가격, 변동률, 거래량 표시
   - 시장 시간 고려한 데이터 업데이트 로직

4. **MacroIndicatorsDashboard 컴포넌트 개발**
   - `/api/v1/market/overview` 연동 (Alpha Vantage 기반)
   - 실제 S&P 500, NASDAQ, DOW 지수 표시
   - 섹터 성과 및 시장 센티먼트 실시간 업데이트

### 📊 Phase 2: 통합 테스트 및 최적화 (Week 3)
**모든 컴포넌트 통합 및 성능 최적화**

1. **API 응답 최적화**
   - 실제 API 응답 시간에 맞춘 SWR 설정 튜닝
   - 에러 처리 및 재시도 로직 최적화
   - 캐싱 전략 실제 데이터 패턴에 맞게 조정

2. **UX 개선**
   - 로딩 상태 실제 API 응답 시간에 맞춰 조정
   - 에러 상태 사용자 친화적 메시지로 개선
   - 데이터 없음 상태 적절한 안내 메시지 표시

3. **성능 및 안정성 검증**
   - 실제 API 호출 성능 테스트
   - 네트워크 오류 시나리오 테스트
   - 동시 다중 컴포넌트 데이터 로딩 테스트

### ⚡ Phase 3: Production 배포 (Week 4)
**프로덕션 환경 배포 및 모니터링**

1. **배포 준비**
   - Vercel 환경 변수 설정 (NEXT_PUBLIC_API_URL)
   - Railway 백엔드와의 CORS 설정 확인
   - API 키 및 보안 설정 검증

2. **모니터링 시스템 구축**
   - SWR devtools를 통한 API 호출 모니터링
   - 실제 사용자 환경에서의 성능 메트릭 수집
   - 에러 추적 및 알림 시스템 구축

3. **사용자 테스트**
   - 실제 주식 심볼을 사용한 종단간 테스트
   - 다양한 디바이스 및 브라우저에서 동작 확인
   - API 응답 시간 및 사용자 경험 최적화

**예상 결과**: Mock 데이터 없는 완전한 실제 API 기반 Production 시스템

---

## 🛠 기술 명세 및 환경 설정

### 필수 의존성
```json
{
  "dependencies": {
    "swr": "^2.2.0",
    "date-fns": "^2.30.0",
    "react-intersection-observer": "^9.5.0",
    "react-error-boundary": "^4.0.11"
  }
}
```

### Railway 백엔드 연동 설정
```typescript
// lib/api.ts - Railway 백엔드 API 설정
export const API_CONFIG = {
  // Railway 프로덕션 URL 또는 로컬 개발 URL
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 15000, // 실제 API 응답 시간 고려하여 증가
  retries: 2, // Claude AI 호출 시간 고려하여 감소
  headers: {
    'Content-Type': 'application/json',
  }
};

// lib/swr-config.ts - 실제 API에 최적화된 SWR 설정
export const SWR_CONFIG = {
  // API별 차별화된 refresh interval
  refreshInterval: (data, error) => {
    if (error) return 30000; // 에러 시 30초
    return 300000; // 기본 5분
  },
  revalidateOnFocus: false,
  shouldRetryOnError: (error) => {
    // 5xx 에러는 재시도, 4xx 에러는 재시도 안함
    return error.status >= 500;
  },
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  dedupingInterval: 60000, // 1분간 중복 요청 방지
  // 실제 API 응답에 따른 조건부 revalidation
  revalidateIfStale: true,
  revalidateOnMount: true
};
```

### 스타일링 가이드
```css
/* CSS 변수 정의 */
:root {
  --component-bg: #ffffff;
  --component-border: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --border-radius: 8px;
}
```

---

## 📊 성능 및 품질 기준

### 성능 목표
- **초기 로딩**: < 2초
- **API 응답 대기**: < 3초
- **데이터 새로고침**: < 1초
- **번들 크기 증가**: < 100KB

### 품질 보증
- **TypeScript 커버리지**: 100%
- **에러 처리**: 모든 API 호출 에러 경계
- **접근성**: WCAG 2.1 AA 준수
- **테스트 커버리지**: 주요 기능 90%

### 모니터링 지표
- **API 성공률**: > 95%
- **캐시 적중률**: > 80%
- **에러 발생률**: < 1%
- **사용자 만족도**: 피드백 기반

---

## 🚀 배포 및 운영

### 개발 환경
- **로컬 개발**: 백엔드와 동시 실행
- **핫 리로딩**: SWR 캐시 호환
- **디버깅**: API 호출 추적 가능

### 프로덕션 환경
- **CDN 최적화**: Vercel Edge Network
- **캐싱 전략**: 다단계 캐시 시스템
- **모니터링**: 실시간 성능 추적

---

## 📝 결론 및 즉시 시작 가능한 작업

### 주요 개선사항
1. **컴포넌트 분리**: 4개 독립 컴포넌트로 개별 개발 가능
2. **실용적 접근**: 현재 백엔드 데이터에 최적화
3. **점진적 향상**: 단계별 기능 확장 가능
4. **유지보수성**: 명확한 데이터 플로우 및 에러 처리

### 즉시 시작 가능한 작업 순서 (Mock 데이터 없음)
1. **AI News Analysis Component** - 가장 완성도 높은 `/api/v1/news/:symbol` API 직접 연동
2. **AI Investment Opinion Component** - 동일한 API의 overview 섹션 사용
3. **Stock Profile Component** - `/api/v1/stocks/:symbol` API 연동 (Alpha Vantage 기반)
4. **Macro Indicators Component** - `/api/v1/market/overview` API 연동
5. **통합 테스트** - 모든 컴포넌트 동시 실행 및 성능 검증
6. **Production 배포** - Vercel + Railway 환경에서 최종 검증

### 개발 시 핵심 원칙
- **Mock 데이터 완전 제거**: 처음부터 실제 API만 사용
- **실제 API 응답 시간 고려**: 로딩 상태 및 타임아웃 설정 최적화
- **Railway 백엔드 직접 연동**: 로컬 개발 시에도 실제 배포된 API 사용
- **실제 데이터 패턴 반영**: UI 컴포넌트가 실제 API 응답 구조에 맞게 구현
- **에러 처리 강화**: 실제 네트워크 환경에서 발생할 수 있는 모든 에러 상황 고려

이 명세서는 실제 개발 과정에서 발견되는 요구사항에 따라 유연하게 조정될 수 있으며, 각 컴포넌트별로 세분화된 개발이 가능하도록 설계되었습니다.

---

**문서 버전**: 2.0  
**작성일**: 2025년 8월 21일  
**작성자**: Claude (AI Architecture Specialist)  
**검토 완료**: 컴포넌트별 개별 개발 계획 기반