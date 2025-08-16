# Investie: 단계별 개발 가이드 (4인 팀용)

## 🎯 소개: "Vibe Coding" 접근 방식

이 가이드는 Investie MVP를 위한 단계별 개발 전략을 설명합니다. 우리는 "Vibe Coding" 접근 방식을 따를 것입니다:

1.  **Phase 0 (기반 다지기):** 프로젝트 리더가 공유 타입, 목업 데이터, 플레이스홀더 컴포넌트/서비스를 포함한 전체 프로젝트의 뼈대를 구축합니다. 이는 병렬 개발을 가능하게 합니다.
2.  **Phase 1 (모듈식 기능 개발):** 4인 팀은 수직적 단위(vertical slice)로, 모듈별로 기능을 개발합니다. 각 개발자는 자신의 전문 분야에서 작업하지만, 자주 통합합니다.
3.  **Phase 2 (통합 및 폴리싱):** 팀은 모든 모듈을 통합하고, 종단 간(end-to-end) 테스트를 수행하며, 출시를 위해 애플리케이션을 최적화합니다.

이 전략은 의존성을 최소화하고 즉각적인 시각적 피드백을 제공하여, 모든 팀원이 첫날부터 효율적으로 병렬 작업을 할 수 있도록 보장합니다.

---

## 📋 Phase 0: 프로젝트 기반 구축 (프로젝트 리더 담당)

**목표:** 모든 환경에서 컴파일되는 동작 가능한 모노레포(monorepo) 뼈대 만들기. 이를 통해 프론트엔드와 백엔드 개발자들이 서로를 기다리지 않고 첫날부터 개발을 시작할 수 있습니다.

### 1단계: 모노레포 구조 초기화

다음 구조를 가진 Nx 기반의 모노레포를 설정합니다.

```bash
investie/
├── apps/
│   ├── mobile/        # React-Native (Expo) 앱
│   ├── web/           # Next.js 14 앱
│   └── backend/       # NestJS API 서버
├── packages/
│   ├── types/         # 공유 TypeScript 인터페이스
│   ├── mock/          # 공유 목업 데이터 (JSON 파일)
│   └── utils/         # 공유 헬퍼 함수 (빈 껍데기)
├── scripts/
│   └── mock-server.ts # 옵션: 목업 JSON을 제공하는 간단한 서버


2단계: 공유 타입 정의 (packages/types)
모든 데이터 구조의 "단일 진실 공급원(single source of truth)"을 만듭니다. 이것은 프론트엔드와 백엔드 간의 계약입니다.

파일: packages/types/src/index.ts

TypeScript

// ===================================
// API 및 제네릭 헬퍼 타입
// ===================================
export type Status = 'low' | 'medium' | 'high' | 'fear' | 'neutral' | 'greed' | 'oversold' | 'overbought';
export type Trend = 'up' | 'down' | 'flat';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: string;
}

// ===================================
// 시장 요약 카드 타입
// ===================================
export interface FearGreedIndex {
  value: number;
  status: 'fear' | 'neutral' | 'greed';
  source: 'claude_search';
}

export interface Vix {
  value: number;
  status: 'low' | 'medium' | 'high';
  source: 'google_finance';
}

export interface InterestRate {
  value: number;
  aiOutlook: string; // Claude 생성 텍스트
  source: 'fred_api';
}

export interface Cpi {
  value: number;
  monthOverMonth: number;
  direction: 'up' | 'down';
  source: 'fred_api';
}

export interface UnemploymentRate {
  value: number;
  monthOverMonth: number;
  source: 'fred_api';
}

export interface SP500Sparkline {
  data: number[];
  weeklyTrend: 'up' | 'down' | 'flat';
  source: 'google_finance';
}

export interface MarketSummaryData {
  fearGreedIndex: FearGreedIndex;
  vix: Vix;
  interestRate: InterestRate;
  cpi: Cpi;
  unemploymentRate: UnemploymentRate;
  sp500Sparkline: SP500Sparkline;
}

// ===================================
// 개별 주식 카드 타입
// ===================================
export type StockSymbol = 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD';

export interface StockPrice {
  current: number;
  change: number;
  changePercent: number;
  source: 'google_finance';
}

export interface StockFundamentals {
  pe: number;
  marketCap: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  source: 'google_finance';
}

export interface StockTechnicals {
  rsi: number;
  rsiStatus: 'oversold' | 'neutral' | 'overbought';
}

export interface StockNewsSummary {
  headline: string; // Claude 생성 한 줄 요약
  sentiment: 'positive' | 'neutral' | 'negative';
  source: 'google_news + claude_ai';
}

export interface SectorPerformance {
  name: string;
  weeklyChange: number;
  source: 'google_finance';
}

// 주가 차트 타입
export interface StockPricePoint {
  timestamp: string; // ISO 날짜 문자열
  price: number;
  volume?: number;
}

export interface StockPriceChart {
  period: '1D' | '1W' | '1M' | '3M' | '1Y';
  data: StockPricePoint[];
  trend: 'up' | 'down' | 'flat';
  change: number;
  changePercent: number;
  source: 'google_finance';
}

// AI 종합평가 타입
export interface AIEvaluation {
  summary: string; // 2-3문장의 종합적인 AI 분석
  rating: 'bullish' | 'neutral' | 'bearish';
  confidence: number; // 0-100 신뢰도 점수
  keyFactors: string[]; // 평가에 영향을 미치는 3-4개 주요 요인
  timeframe: '1W' | '1M' | '3M'; // 평가 시간 범위
  source: 'claude_ai';
  lastUpdated: string; // ISO 타임스탬프
}

export interface StockCardData {
  symbol: StockSymbol;
  name: string;
  price: StockPrice;
  priceChart: StockPriceChart; // 새로 추가: 과거 가격 차트 데이터
  fundamentals: StockFundamentals;
  technicals: StockTechnicals;
  aiEvaluation: AIEvaluation; // 새로 추가: 뉴스 이전에 표시되는 AI 종합평가
  newsSummary: StockNewsSummary;
  sectorPerformance: SectorPerformance;
}

// AI 챗봇 타입
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: 'market' | 'stock' | 'general';
  relatedSymbol?: StockSymbol;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  isActive: boolean;
  lastActivity: string;
}

export interface ChatbotState {
  isOpen: boolean;
  isLoading: boolean;
  currentSession: ChatSession | null;
  recentSessions: ChatSession[];
}

// 사용자 인증 타입
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: 'google' | 'facebook' | 'github' | 'email';
  createdAt: string;
  lastLoginAt: string;
}

// 관심종목 관리 타입
export interface WatchlistItem {
  symbol: StockSymbol;
  addedAt: string;
  customName?: string; // 사용자 정의 종목명
  order: number; // 목록 내 순서
}

export interface Watchlist {
  userId: string;
  items: WatchlistItem[];
  maxItems: number; // 최대 종목 수 (기본 10개)
  lastUpdated: string;
}


3단계: 목업 데이터 생성 (packages/mock)
위에서 정의한 타입을 기반으로 JSON 파일을 생성합니다.

파일: packages/mock/src/market-summary.json

JSON

{
  "fearGreedIndex": {
    "value": 38,
    "status": "fear",
    "source": "claude_search"
  },
  "vix": {
    "value": 17.5,
    "status": "medium",
    "source": "google_finance"
  },
  "interestRate": {
    "value": 5.33,
    "aiOutlook": "연준은 다음 분기까지 금리를 동결할 것으로 예상됩니다.",
    "source": "fred_api"
  },
  "cpi": {
    "value": 3.4,
    "monthOverMonth": 0.1,
    "direction": "up"
  },
  "unemploymentRate": {
    "value": 3.9,
    "monthOverMonth": 0.1
  },
  "sp500Sparkline": {
    "data": [4780, 4785, 4790, 4770, 4795, 4805, 4800],
    "weeklyTrend": "up",
    "source": "google_finance"
  }
}
파일: packages/mock/src/stocks.json

JSON

{
  "AAPL": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": {
      "current": 195.89,
      "change": 2.34,
      "changePercent": 1.21
    },
    "fundamentals": {
      "pe": 28.5,
      "marketCap": 3050000000000,
      "volume": 45680000,
      "fiftyTwoWeekHigh": 199.62,
      "fiftyTwoWeekLow": 164.08
    },
    "technicals": {
      "rsi": 62,
      "rsiStatus": "neutral"
    },
    "newsSummary": {
      "headline": "분석가들은 초기 공급망 우려에도 불구하고 비전 프로 판매 전망에 대해 여전히 긍정적입니다.",
      "sentiment": "positive"
    },
    "sectorPerformance": {
      "name": "Technology",
      "weeklyChange": 2.1
    }
  },
  "TSLA": {
     "symbol": "TSLA",
     "name": "Tesla, Inc.",
     "price": {
        "current": 250.22,
        "change": -5.67,
        "changePercent": -2.22
     },
     "fundamentals": {
        "pe": 75.4,
        "marketCap": 790000000000,
        "volume": 112000000,
        "fiftyTwoWeekHigh": 299.29,
        "fiftyTwoWeekLow": 101.81
     },
     "technicals": {
        "rsi": 45,
        "rsiStatus": "neutral"
     },
     "newsSummary": {
        "headline": "테슬라, 인도에 새로운 공장 계획을 발표하며 미래 생산 능력 증대.",
        "sentiment": "positive"
     },
     "sectorPerformance": {
        "name": "Consumer Discretionary",
        "weeklyChange": -0.5
     }
  }
  // ... 기본 10개 주식(MSFT, GOOGL, AMZN 등)에 대한 목업 데이터 추가
}


4단계: 애플리케이션 뼈대(스켈레톤) 구성
비어 있지만 컴파일 가능한 컴포넌트와 서비스를 만듭니다.

프론트엔드 (apps/mobile & apps/web):

TypeScript

// 파일: apps/mobile/src/components/cards/MarketSummaryCard.tsx
import React from 'react';
import { Text, View } from 'react-native';

export const MarketSummaryCard = () => <View><Text>안녕하세요 시장 요약 카드</Text></View>;

// 파일: apps/mobile/src/components/cards/StockCard.tsx
import React from 'react';
import { Text, View } from 'react-native';

export const StockCard = ({ symbol }: { symbol: string }) => <View><Text>안녕하세요 {symbol}</Text></View>;
백엔드 (apps/backend):

TypeScript

// 파일: apps/backend/src/market/market.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('/api/v1/market-summary')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get()
  getMarketSummary() {
    return this.marketService.getSummary();
  }
}

// 파일: apps/backend/src/market/market.service.ts
import { Injectable } from '@nestjs/common';
import * as mockData from '@investie/mock/src/market-summary.json';
import { MarketSummaryData } from '@investie/types';

@Injectable()
export class MarketService {
  getSummary(): MarketSummaryData {
    // 초기에는 목업 데이터만 반환
    return mockData;
  }
}


5단계: 스크립트 설정 (package.json)
루트 package.json에 모든 앱을 동시에 실행하는 스크립트를 설정합니다.

JSON

{
  "scripts": {
    "dev": "concurrently \"npm:dev:mobile\" \"npm:dev:web\" \"npm:dev:backend\"",
    "dev:mobile": "nx run mobile:start",
    "dev:web": "nx run web:dev",
    "dev:backend": "nx run backend:start:dev",
    "typecheck": "tsc --noEmit -p tsconfig.base.json"
  }
}
✅ Phase 0 완료 체크리스트
[ ] investie 모노레포가 생성되어 Git에 푸시되었습니다.

[ ] packages/types에 필요한 모든 인터페이스가 포함되어 있으며 오류 없이 컴파일됩니다.

[ ] packages/mock에 market-summary와 10개 주식 전체에 대한 JSON 파일이 포함되어 있습니다.

[ ] npm run dev 명령이 모바일, 웹, 백엔드 서버를 오류 없이 성공적으로 시작합니다.

[ ] 모바일 앱이 시뮬레이터에서 실행되고 플레이스홀더 텍스트를 표시합니다.

[ ] 웹 앱이 localhost:3001(또는 설정된 포트)에서 접근 가능하며 플레이스홀더 텍스트를 표시합니다.

[ ] 백엔드 엔드포인트 /api/v1/market-summary가 목업 JSON 데이터를 반환합니다.

[ ] 네 명의 모든 개발자가 레포지토리를 클론하고 npm run dev를 성공적으로 실행했습니다.


📋 Phase 1: 모듈식 개발 (4인 팀 담당)
기반이 마련되었으므로, 이제 팀은 병렬 개발을 시작할 수 있습니다. 각 단계는 하나의 기능 단위(feature slice)에 집중합니다.

팀 역할:

프론트엔드 1 (FE1 - 그래프 & 시각화): 차트, 데이터 시각화 전문가.

프론트엔드 2 (FE2 - UI/UX & 레이아웃): 레이아웃, 컴포넌트, 데이터 표시 전문가.

백엔드 1 (BE1 - 금융 데이터): Google Finance & FRED API 전문가.

백엔드 2 (BE2 - 뉴스 & AI): News & Claude API 전문가.

1단계: 시장 요약 카드 만들기
목표: 첫 번째 완전한 기능 카드 만들기.

역할	작업 내용
FE1	1. Recharts를 사용하여 S&P500Sparkline 컴포넌트 구현. <br> 2. FearGreedIndex 원형 게이지 컴포넌트 구현. <br> 3. 이 컴포넌트들이 MarketSummaryData 타입 기반의 props를 받도록 연결.
FE2	1. MarketSummaryCard 컴포넌트의 메인 레이아웃 구축. <br> 2. VIX, InterestRate, CPI, UnemploymentRate를 표시할 UI 요소 생성. <br> 3. FE1의 차트 컴포넌트들을 레이아웃에 통합. <br> 4. 백엔드의 (목업) /market-summary 엔드포인트에서 데이터를 가져와 자식 컴포넌트에 props 전달.
BE1	1. FRED API에서 실제 데이터(CPI, 금리, 실업률)를 가져오는 서비스 구현. <br> 2. Google Finance API에서 VIX 및 S&P500 스파크라인 데이터를 가져오는 서비스 구현. <br> 3. MarketService의 목업 데이터를 이 새로운 서비스 호출로 교체. <br> 4. Redis 캐싱 전략 구현 (경제 지표는 24시간 캐시).
BE2	1. Claude Search API를 사용하여 실시간 CNN 공포 탐욕 지수 값을 가져오는 서비스 구현. <br> 2. Claude API를 사용하여 금리에 대한 aiOutlook 텍스트를 생성하는 서비스 구현. <br> 3. 이 서비스들을 MarketService에 통합. <br> 4. Redis 캐싱 전략 구현 (AI 요약은 12시간 캐시).

Export to Sheets
2단계: 주식 카드 기반 만들기
목표: 재사용 가능하고 데이터 기반의 StockCard 컴포넌트 만들기.

역할	작업 내용
FE1	1. 가격, 변동, 변동률을 적절한 빨강/초록색으로 보여주는 제네릭 PriceIndicator 컴포넌트 생성. <br> 2. RSI 값에 따라 "과매수" 또는 "과매도"를 표시하는 간단한 RSIIndicator 구현.
FE2	1. StockCard 컴포넌트의 메인 레이아웃 설계 및 구축. <br> 2. StockCardData 객체를 prop으로 받도록 설계. <br> 3. name, symbol, marketCap, volume, P/E, 52주 범위를 표시하는 UI 요소 생성. <br> 4. FE1의 PriceIndicator와 RSIIndicator 통합. <br> 5. 뉴스 요약을 위한 플레이스홀더 섹션 생성.
BE1	1. getStockBySymbol(symbol: StockSymbol) 메서드를 가진 StocksService 구현. <br> 2. 이 서비스를 Google Finance API에서 가격 및 기본 데이터를 가져오도록 연결. <br> 3. StocksController에 /api/v1/stocks/:symbol 엔드포인트 생성. <br> 4. 주식 데이터에 대한 5분 캐싱 전략 구현.
BE2	1. NewsService와 RSI 계산 메서드 구현. <br> 2. 이 서비스는 주어진 심볼에 대해 Google News API에서 뉴스를 가져옴. <br> 3. 그런 다음 Claude API를 사용하여 한 줄 headline과 sentiment 생성. <br> 4. 계산된 기술적 지표(RSI)와 뉴스 요약을 /stocks/:symbol 엔드포인트의 데이터 페이로드에 추가.

Export to Sheets
3단계: 병렬 개발 - 모든 주식 카드 구현
목표: 앱에 기본 10개 주식 카드를 모두 채우기.

역할	작업 내용
개발자 A (시장 요약 모듈 담당)	- 처음 3개 주식 카드 통합 및 표시: AAPL, TSLA, MSFT. <br> - 통합 경험을 바탕으로 MarketSummaryCard 개선.
개발자 B (주식 카드 모듈 1 담당)	- 다음 3개 주식 카드 통합 및 표시: GOOGL, AMZN, NVDA. <br> - StockCard 컴포넌트가 견고하고 다양한 데이터 형태를 우아하게 처리하는지 확인.
개발자 C (주식 카드 모듈 2 담당)	- 다음 2개 주식 카드 통합 및 표시: META, NFLX. <br> - 카드 목록의 성능 최적화에 집중.
개발자 D (인증 & 주식 카드 모듈 담당)	- 마지막 2개 주식 카드 통합 및 표시: AVGO, AMD. <br> - 인증 UI 뼈대(로그인/로그아웃 버튼) 구현 시작.

Export to Sheets
4단계: 인증 및 개인화 구현
목표: 사용자 로그인 및 개인화된 관심종목 목록 추가.

역할	작업 내용
FE1/FE2 (페어)	1. 로그인/설정 화면 구축. <br> 2. 소셜 로그인(Google, Facebook, GitHub)을 위한 UI 흐름 구현. <br> 3. 10개 주식 관심종목 목록을 관리하는 UI 생성. <br> 4. 메인 화면을 수정하여 로그인 시 사용자의 관심종목을, 그렇지 않으면 기본 10개 주식을 표시하도록 함.
BE1/BE2 (페어)	1. BE1: PostgreSQL 및 사용자/관심종목 데이터베이스 스키마 설정. <br> 2. BE2: 소셜 로그인을 위한 Firebase Auth 통합. <br> 3. 사용자 데이터를 관리하기 위한 /api/v1/user/watchlist (GET, POST) 엔드포인트 생성. <br> 4. JWT 토큰을 요구하여 엔드포인트 보안 설정.

Export to Sheets
## 🎉 현재 구현 상태

### ✅ 백엔드 구현 완료
**Phase 0 ➜ Phase 1 ➜ Phase 2 - 완전 구현 완료**

#### BE1 (금융 데이터) - ✅ 완료
- ✅ FRED API 통합 FinancialDataService (CPI, 금리, 실업률)
- ✅ Google Finance API 통합 (VIX, S&P500 데이터)  
- ✅ 주기적 업데이트를 위한 MarketDataScheduler
- ✅ Redis 캐싱 전략 (경제 지표 24시간 캐시)
- ✅ getStockBySymbol 메서드를 가진 StocksService
- ✅ 주식 차트 데이터를 위한 HistoricalDataService (1D, 1W, 1M, 3M, 1Y)
- ✅ 주식 데이터 5분 캐시, 차트 데이터 1시간 캐시
- ✅ 완전한 API 엔드포인트: `/api/v1/stocks/:symbol`, `/api/v1/stocks`

#### BE2 (뉴스 & AI) - ✅ 완료
- ✅ Claude Search API를 사용한 AiContentService (공포 & 탐욕 지수)
- ✅ 금리 AI 전망을 위한 Claude API 통합
- ✅ 종합적인 주식 분석을 위한 AIEvaluationService
- ✅ Google News + Claude API 통합 NewsService
- ✅ RSI 계산 및 기술적 분석
- ✅ 세션 관리 및 컨텍스트 인식을 가진 ChatService  
- ✅ 완전한 채팅 API 엔드포인트: `/api/v1/chat/sessions/*`
- ✅ Redis 캐싱 전략: AI 콘텐츠 12시간, 뉴스 6시간, 채팡 1시간

#### 통합 백엔드 아키텍처 - ✅ 완료
- ✅ StocksService에서 BE1 + BE2 데이터 통합
- ✅ AI 강화 공포 & 탐욕 지수가 포함된 시장 요약
- ✅ AI 평가 + 뉴스 + RSI + 가격 차트가 포함된 주식 카드
- ✅ 목업 데이터를 사용한 완전한 대체 시스템
- ✅ 모든 서비스에 걸친 종합적인 캐싱
- ✅ 모든 10개 대상 주식 (AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, NFLX, AVGO, AMD)

### 🔧 사용 가능한 API 엔드포인트
```bash
# 핵심 시장 데이터 (AI 강화)
GET /api/v1/market-summary     # AI 공포 & 탐욕 + 금리 전망이 포함된 시장 데이터

# 주식 데이터 (완전 통합)  
GET /api/v1/stocks             # 완전한 BE1+BE2 데이터를 포함한 모든 10개 주식
GET /api/v1/stocks/:symbol     # AI 평가 + 뉴스 + RSI가 포함된 개별 주식
GET /api/v1/stocks/:symbol/chart?period=1W  # 과거 차트 데이터

# AI 챗봇 시스템
POST /api/v1/chat/sessions     # 새 채팕 세션 생성
POST /api/v1/chat/sessions/:id/messages  # AI에 메시지 전송
GET  /api/v1/chat/sessions/:id # 세션 기록 가져오기
GET  /api/v1/chat/sessions     # 최근 세션 목록
DELETE /api/v1/chat/sessions/:id  # 세션 종료

# 건강 상태 및 상태
GET /api/v1/health             # 백엔드 건강 상태 확인
GET /api/v1/chat/health        # 채팕 서비스 건강 상태
```

### 🗂️ 현재 데이터 구조 (완전 구현)
모든 목업 데이터는 완전한 BE1 + BE2 필드를 포함합니다:
- ✅ 시장 요약: 실시간 공포 & 탐욕 + AI 금리 전망
- ✅ 주식 카드: 가격 차트 + AI 평가 + 뉴스 요약 + RSI
- ✅ 채팕 시스템: 세션 기반 AI 투자 어시스턴트

### 📋 프론트엔드 개발 준비 완료
BE1과 BE2가 완료되어 프론트엔드 개발자들은 이제:
1. 실제 AI 강화 데이터로 MarketSummaryCard 구축
2. 통합된 가격 차트와 AI 평가가 포함된 StockCard 컴포넌트 생성  
3. AI 챗봇 인터페이스 구현 (웹 사이드바, 모바일 모달)
4. 백엔드 API 개발을 기다리지 않고 UI/UX에 집중
5. 라이브 백엔드 엔드포인트 사용 또는 종합적인 목업 데이터로 대체

### 🔑 프로덕션 요구사항
완전한 AI 기능을 위해 다음 API 키를 설정하세요:
```bash
CLAUDE_API_KEY=your-claude-api-key
GOOGLE_NEWS_API_KEY=your-news-api-key  
GOOGLE_FINANCE_API_KEY=your-finance-api-key
FRED_API_KEY=your-fred-api-key
```

### 🆕 신규 기능 요구사항 (Phase 3)

#### 사용자 인증 시스템
- **로그인 방식**: Google, Facebook, GitHub 소셜 로그인
- **세션 관리**: JWT 토큰 기반 인증
- **사용자 프로필**: 기본 정보 및 설정 관리

#### 관심종목 관리 시스템
- **기본 종목**: 비로그인 사용자는 기본 10개 종목 (AAPL, TSLA, MSFT, GOOGL, AMZN, NVDA, META, NFLX, AVGO, AMD)
- **맞춤 관심종목**: 로그인 사용자는 개인 주식 관심종목 관리
- **관리 기능**: 종목 추가/제거/순서 변경
- **주식 한계**: 최대 10개 (향후 확장 가능)

#### UI 레이아웃 및 배치

**데스크톱 레이아웃 (1024px+):**
```
┌─────────────────────┬───────────────────┬─────────────────────┐
│                     │  관심종목 위젯     │                     │
│                     │  ┌─────────────┐   │                     │
│   주 콘텐츠          │  │ [+ 주식 추가] │   │   AI 챗봇           │
│   ┌─────────────┐   │  │ ○ AAPL       │   │   ┌─────────────┐   │
│   │시장 요약     │   │  │ ○ TSLA       │   │   │ 채팕 헤더   │   │
│   └─────────────┘   │  │ ○ MSFT   [x] │   │   ├─────────────┤   │
│   ┌─────────────┐   │  └─────────────┘   │   │  메시지     │   │
│   │주식 카드 1   │   │                     │   │  영역       │   │
│   │ - 차트      │   │                     │   ├─────────────┤   │
│   │ - AI 평가   │   │                     │   │ 입력 박스   │   │
│   │ - 뉴스      │   │                     │   └─────────────┘   │
│   └─────────────┘   │                     │                     │
└─────────────────────┴───────────────────┴─────────────────────┘
```

**모바일 레이아웃:**
- **관심종목**: 헤더 드롭다운 또는 서랍 메뉴
- **AI 챗봇**: 플로팅 버튼으로 모달/바텀 시트 호출
- **주식 목록**: 세로 스크롤 카드 목록

#### 새로운 API 엔드포인트
```bash
# 인증 시스템
POST /api/v1/auth/login      # 소셜 로그인
POST /api/v1/auth/logout     # 로그아웃
GET  /api/v1/auth/profile    # 사용자 프로필

# 관심종목 관리
GET    /api/v1/user/watchlist     # 사용자의 관심종목
POST   /api/v1/user/watchlist     # 주식 추가
DELETE /api/v1/user/watchlist/:symbol  # 주식 제거
PUT    /api/v1/user/watchlist/order    # 주식 순서 변경
```

#### 통합 의존성
- **메인 화면 업데이트**: 로그인 상태에 따라 기본 10개 주식 vs 사용자 관심종목 표시
- **실시간 동기화**: 관심종목 변경 시 메인 화면 자동 업데이트
- **상태 관리**: 사용자 인증 및 관심종목에 대한 전역 상태
- **캐싱 전략**: 사용자별 관심종목 캐싱 (1시간 TTL)

📋 Phase 2: 통합, 테스트 & 폴리싱
목표: 안정적이고 성능 좋은 릴리스를 위해 MVP 마무리.

역할	작업 내용
FE1	- 성능 최적화: 차트 렌더링 분석 및 최적화. 카드 뷰에 FlatList 구현. <br> - 더 나은 로딩 경험을 위해 스켈레톤 로더(SkeletonCard) 구현.
FE2	- UI/UX 폴리싱: 미묘한 애니메이션과 전환 추가. 모든 화면에서 일관된 디자인 보장. <br> - API 실패에 대한 전역 에러 처리 상태(예: ErrorCard) 구현. <br> - 메인 화면에 "당겨서 새로고침" 기능 추가.
BE1	- 모든 금융 데이터 엔드포인트에 대한 종단 간(E2E) 테스트. <br> - /stocks/:symbol 엔드포인트에 대한 부하 테스트. <br> - 데이터베이스 최적화 및 백업 전략.
BE2	- AI 및 뉴스 생성 파이프라인에 대한 E2E 테스트. <br> - API 비용 모니터링 및 최적화 (예: Claude 프롬프트 개선). <br> - 보안 조치 최종화 (API 키 관리, 환경 변수).
전원	- 기능 간 교차 테스트 참여. <br> - 통합 단계에서 발견된 버그 수정. <br> - 앱 스토어 제출을 위한 문서 준비.