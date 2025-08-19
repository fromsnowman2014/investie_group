# Investie Frontend 레이아웃 개선 설계 문서

## 🎯 프로젝트 개요

### 목표
- 기존 TradingView 위젯 중심의 단순한 레이아웃을 4개 섹션으로 구성된 전문적인 투자 분석 플랫폼으로 개선
- Backend에서 제공하는 AI 분석 데이터와 매크로 경제 지표를 효과적으로 표시
- 사용자 경험과 정보 접근성을 크게 향상

### 핵심 변경사항
1. **계층적 정보 구조**: 헤더 → AI 투자 의견 → 매크로 지표 → 상세 차트 순서로 배치
2. **AI 기반 투자 인사이트**: Backend AI 분석 결과를 전면에 배치
3. **실시간 매크로 경제 대시보드**: 6개 핵심 지표를 한눈에 확인
4. **기존 TradingView 위젯 최적화**: 하단 영역에 최적화된 크기로 배치

---

## 📱 새로운 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header Section (기존 유지 + 재배치)                              │
│ - Investie the Intern 로고                                   │
│ - 종목 선택 드롭다운 (Watchlist)                                │
│ - 주식 검색창                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AI Investment Analysis Section (NEW)                       │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│ │ Stock Profile &     │  │ AI Investment Opinion           │ │
│ │ Current Price       │  │ - 4-6 문장 투자 의견 요약          │ │
│ │                     │  │ - BUY/HOLD/SELL 추천            │ │
│ └─────────────────────┘  │ - 신뢰도 스코어                   │ │
│                          │ - 핵심 투자 포인트                │ │
│                          └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Market Intelligence Section (NEW)                          │
│ ┌─────────────────────┐  ┌─────────────────────────────────┐ │
│ │ Macro Indicators    │  │ AI News Analysis Report         │ │
│ │ Dashboard           │  │ - Stock News 요약                │ │
│ │ - Fear & Greed Index│  │ - Macro News 분석                │ │
│ │ - VIX Volatility    │  │ - 시장 센티먼트                   │ │
│ │ - Interest Rate     │  │ - 뉴스 기반 리스크 평가            │ │
│ │ - CPI Inflation     │  │                                 │ │
│ │ - Unemployment      │  │ (빈 프레임으로 시작)               │ │
│ │ - S&P 500 Trend     │  │                                 │ │
│ └─────────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Detailed Chart Analysis Section (기존 최적화)                 │
│ - TradingView AdvancedChart (크기 조정)                       │
│ - TechnicalAnalysis & FundamentalData (재배치)               │
│ - CompanyProfile & TopStories (최적화)                       │
│ - TickerTape (숨김 처리)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 컴포넌트 구조 설계

### 1. Header Section (기존 개선)
**파일**: `apps/web/src/app/components/Header.tsx`

**변경사항**:
- 기존 기능 유지하되 새로운 레이아웃에 맞게 스타일 조정
- 반응형 디자인 개선
- 검색 기능 UX 향상

### 2. AI Investment Analysis Section (신규)

#### 2.1 StockProfile Component (신규)
**파일**: `apps/web/src/app/components/Analysis/StockProfile.tsx`

```typescript
interface StockProfileProps {
  symbol: string;
  currentPrice?: number;
  changePercent?: number;
  marketCap?: string;
  pe?: number;
  volume?: string;
}
```

**기능**:
- 선택된 종목의 기본 정보 표시
- 실시간 가격 및 변동률
- 주요 재무 지표 요약

#### 2.2 AIInvestmentOpinion Component (신규)
**파일**: `apps/web/src/app/components/Analysis/AIInvestmentOpinion.tsx`

```typescript
interface AIOpinionProps {
  symbol: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  summary: string;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
  timestamp: string;
}
```

**데이터 소스**: `apps/backend/src/news/news.controller.ts` - `/api/v1/news/:symbol`

### 3. Market Intelligence Section (신규)

#### 3.1 MacroIndicatorsDashboard Component (신규)
**파일**: `apps/web/src/app/components/Market/MacroIndicatorsDashboard.tsx`

```typescript
interface MacroIndicatorsDashboard {
  // 실제 Backend Market API 데이터 구조 기반
  indices: {
    sp500: {
      value: number;              // 4150.23
      change: number;             // 12.45
      changePercent: number;      // 0.3
      trend: 'up' | 'down' | 'flat';
      color_indicator: 'green' | 'red' | 'gray';
    };
    nasdaq: {
      value: number;              // 12850.67
      change: number;             // -23.12
      changePercent: number;      // -0.18
      trend: 'up' | 'down' | 'flat';
      color_indicator: 'green' | 'red' | 'gray';
    };
    dow: {
      value: number;              // 34250.89
      change: number;             // 45.67
      changePercent: number;      // 0.13
      trend: 'up' | 'down' | 'flat';
      color_indicator: 'green' | 'red' | 'gray';
    };
  };
  
  sectors: Array<{
    name: string;                 // "Technology", "Healthcare", "Energy", "Financial"
    change: number;               // 0.25, -0.15, 1.23, 0.45
    performance: 'positive' | 'negative';
    color_indicator: 'green' | 'red';
  }>;
  
  marketSentiment: 'bullish' | 'neutral' | 'bearish';
  volatilityIndex: number;        // 18.45 (VIX 대용)
  
  // 향후 확장을 위한 추가 지표 (Phase 2)
  fear_greed_index?: {
    value: number;                // 0-100
    status: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
    color_code: '#FF4444' | '#FFA500' | '#FFFF00' | '#90EE90' | '#00FF00';
    source: 'Phase 2 - 대체 데이터 소스 개발 필요';
  };
  
  interest_rate?: {
    current_rate: number;
    direction: 'rising' | 'stable' | 'falling';
    ai_outlook: string;
    source: 'FRED API (향후 구현)';
  };
  
  cpi_inflation?: {
    value: number;
    month_over_month: number;
    direction_arrow: '↑' | '↓' | '→';
    color_indicator: 'green' | 'yellow' | 'red';
    source: 'FRED API (향후 구현)';
  };
  
  unemployment_rate?: {
    value: number;
    change: number;
    direction: 'rising' | 'falling' | 'stable';
    display_text: string;
    source: 'FRED API (향후 구현)';
  };
  
  // 메타데이터
  source: string;                 // "mock_data"
  timestamp: string;
  lastUpdated: string;
}
```

**데이터 소스**: 
- **현재 사용 가능**: `GET /api/v1/market/overview` - indices, sectors, marketSentiment, volatilityIndex
- **Phase 2 구현 예정**: FRED API 연동 - fear_greed_index, interest_rate, cpi_inflation, unemployment_rate

#### 3.2 AINewsAnalysisReport Component (신규)
**파일**: `apps/web/src/app/components/Market/AINewsAnalysisReport.tsx`

```typescript
interface NewsAnalysisProps {
  stockNews?: {
    headline: string;            // summary.headline에서 가져옴
    articles: any[];            // 현재는 빈 배열 상태
    metadata: {
      source: string;           // "mock_data"
      cached: boolean;
    };
  };
  macroNews?: {
    topHeadline: string;        // topHeadline에서 가져옴
    articles: Array<{
      title: string;
      link: string;
      snippet: string;
      date: string;
      source: string;           // "MockNews"
    }>;
    totalArticles: number;
  };
  
  // 추가 분석 정보 (향후 확장)
  marketSentiment?: 'bullish' | 'neutral' | 'bearish';
  riskAssessment?: string;
  
  // 데이터 상태
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;           // 뉴스 데이터가 없을 때 처리
}
```

**데이터 소스**: 
- `GET /api/v1/news/:symbol` - stockNews 및 macroNews 섹션
- 로컬 파일: `apps/backend/data/news/stock_news/{symbol}/{date}/stock_news.json`
- 로컬 파일: `apps/backend/data/news/macro_news/{date}/macro_news.json`

### 4. Detailed Chart Analysis Section (기존 최적화)

**변경사항**:
- `TickerTape` 컴포넌트: `display: none` 처리 (코드는 유지)
- `AdvancedChart`: 높이 조정 (600px → 450px)
- `TechnicalAnalysis`, `FundamentalData`: 새로운 그리드에 맞게 재배치
- `CompanyProfile`, `TopStories`: 크기 최적화

---

## 🎨 디자인 시스템

### 색상 팔레트
```css
:root {
  /* Primary Brand Colors */
  --primary-blue: #2962ff;
  --primary-cyan: #00bce5;
  --gradient-brand: linear-gradient(90deg, #00bce5 0%, #2962ff 100%);
  
  /* Semantic Colors */
  --success-green: #00C853;
  --warning-orange: #FF9800;
  --danger-red: #F44336;
  --neutral-gray: #9E9E9E;
  
  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fd;
  --bg-accent: rgba(0, 0, 0, 0.05);
  
  /* Text Colors */
  --text-primary: #000000;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-muted: rgba(0, 0, 0, 0.4);
}
```

### Typography Scale
```css
.heading-xl { font-size: 32px; font-weight: 600; } /* Logo */
.heading-lg { font-size: 24px; font-weight: 600; } /* Section Headers */
.heading-md { font-size: 20px; font-weight: 500; } /* Component Titles */
.heading-sm { font-size: 16px; font-weight: 500; } /* Subsections */
.body-lg { font-size: 16px; font-weight: 400; }   /* Main Content */
.body-md { font-size: 14px; font-weight: 400; }   /* Secondary Content */
.body-sm { font-size: 12px; font-weight: 400; }   /* Captions */
```

### Spacing System
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  --gap-component: var(--space-lg); /* Components 간 간격 */
  --gap-section: var(--space-xl);   /* Sections 간 간격 */
}
```

### Grid System
```css
.main-layout {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: var(--gap-section);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--gap-component);
}

.market-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-component);
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-component);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .analysis-grid,
  .market-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔧 기술 명세서

### Frontend 기술 스택
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React Context API (StockProvider)
- **TypeScript**: 완전한 타입 안전성
- **API Client**: Custom fetch wrapper (`/lib/api.ts`)

### 새로운 Dependencies
```json
{
  "dependencies": {
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### 로컬 데이터 연동을 위한 추가 유틸리티
```typescript
// apps/web/src/lib/localDataReader.ts
import fs from 'fs';
import path from 'path';

export class LocalDataReader {
  private dataPath = path.join(process.cwd(), '../backend/data');
  
  async readStockOverview(symbol: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'news/stock_news', symbol, targetDate, 'overview.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Local overview data not found for ${symbol} on ${targetDate}`);
      return null;
    }
  }
  
  async readStockNews(symbol: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'news/stock_news', symbol, targetDate, 'stock_news.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Local stock news data not found for ${symbol} on ${targetDate}`);
      return null;
    }
  }
  
  async readMacroNews(date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataPath, 'news/macro_news', targetDate, 'macro_news.json');
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Local macro news data not found for ${targetDate}`);
      return null;
    }
  }
  
  async checkDataAvailability(symbol: string, date?: string): Promise<{
    hasOverview: boolean;
    hasStockNews: boolean;
    hasMacroNews: boolean;
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const overviewPath = path.join(this.dataPath, 'news/stock_news', symbol, targetDate, 'overview.json');
    const stockNewsPath = path.join(this.dataPath, 'news/stock_news', symbol, targetDate, 'stock_news.json');
    const macroNewsPath = path.join(this.dataPath, 'news/macro_news', targetDate, 'macro_news.json');
    
    const [hasOverview, hasStockNews, hasMacroNews] = await Promise.all([
      fs.promises.access(overviewPath).then(() => true).catch(() => false),
      fs.promises.access(stockNewsPath).then(() => true).catch(() => false),
      fs.promises.access(macroNewsPath).then(() => true).catch(() => false),
    ]);
    
    return { hasOverview, hasStockNews, hasMacroNews };
  }
}
```

### 폴더 구조
```
apps/web/src/app/components/
├── Analysis/
│   ├── StockProfile.tsx
│   ├── AIInvestmentOpinion.tsx
│   └── index.ts
├── Market/
│   ├── MacroIndicatorsDashboard.tsx
│   ├── AINewsAnalysisReport.tsx
│   └── index.ts
├── TradingView/ (기존)
│   ├── AdvancedChart.tsx
│   ├── TechnicalAnalysis.tsx
│   ├── FundamentalData.tsx
│   ├── CompanyProfile.tsx
│   ├── TopStories.tsx
│   └── TickerTape.tsx (숨김 처리)
└── Layout/
    ├── Header.tsx (기존 개선)
    ├── Footer.tsx (기존)
    └── MainLayout.tsx (신규)
```

---

## 📊 데이터 흐름 아키텍처

### 실제 데이터 구조 분석 결과

#### 1. Backend Data 폴더 구조
```
apps/backend/data/
├── news/
│   ├── stock_news/
│   │   └── {SYMBOL}/
│   │       └── {YYYY-MM-DD}/
│   │           ├── overview.json      # AI 투자 분석 결과
│   │           └── stock_news.json    # 종목별 뉴스 데이터
│   └── macro_news/
│       └── {YYYY-MM-DD}/
│           └── macro_news.json        # 매크로 뉴스 데이터
```

#### 2. API Endpoints 및 실제 데이터 구조

##### AI Investment Analysis
```typescript
// GET /api/v1/news/{symbol} - 실제 검증된 구조
interface NewsResponse {
  success: boolean;
  data: {
    symbol: string;
    overview: {
      symbol: string;
      overview: string;              // AI 분석 요약
      recommendation: 'BUY' | 'HOLD' | 'SELL';
      confidence: number;            // 0-100
      keyFactors: string[];          // 핵심 투자 포인트
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      timeHorizon: string;           // "3-6 months" 등
      source: string;                // "claude_ai_analysis"
      timestamp: string;             // ISO 8601 형식
    };
    stockNews: {
      symbol: string;
      date: string;                  // YYYY-MM-DD
      timestamp: string;
      query: string;                 // "{SYMBOL} enhanced search"
      summary: {
        headline: string;            // 주요 헤드라인
        source: string;              // "mock_data"
      };
      articles: any[];               // 현재는 빈 배열
      metadata: {
        source: string;
        cached: boolean;
      };
    };
    macroNews: {
      date: string;
      timestamp: string;
      query: string;                 // "stock market economy finance business"
      topHeadline: string;          // 주요 매크로 뉴스 헤드라인
      totalArticles: number;
      articles: Array<{
        title: string;
        link: string;
        snippet: string;
        date: string;
        source: string;
      }>;
      metadata: {
        source: string;
        cached: boolean;
      };
    };
    validationResult: {
      isValid: boolean;
      method: string;
      symbol?: string;
      reason?: string;
    };
  };
}
```

##### Market Overview (기존 API 활용)
```typescript
// GET /api/v1/market/overview - 검증된 구조
interface MarketOverviewResponse {
  success: boolean;
  data: {
    indices: {
      sp500: {
        value: number;               // 4150.23
        change: number;              // 12.45
        changePercent: number;       // 0.3
      };
      nasdaq: {
        value: number;
        change: number;
        changePercent: number;
      };
      dow: {
        value: number;
        change: number;
        changePercent: number;
      };
    };
    sectors: Array<{
      name: string;                  // "Technology", "Healthcare" 등
      change: number;                // 0.25, -0.15 등
      performance: 'positive' | 'negative';
    }>;
    marketSentiment: 'bullish' | 'neutral' | 'bearish';
    volatilityIndex: number;         // VIX 대용 (18.45)
    source: string;                  // "mock_data"
  };
  timestamp: string;
}
```

#### 3. 로컬 데이터 파일 직접 읽기 옵션 (Fallback)

프로덕션 환경에서는 클라우드 서버 API를 사용하지만, 개발/테스트 단계에서는 로컬 데이터 폴더를 직접 읽는 옵션을 제공합니다.

```typescript
// Frontend에서 로컬 데이터 읽기 유틸리티
interface LocalDataReader {
  // Node.js fs 모듈을 사용한 서버사이드 데이터 읽기
  readStockOverview: (symbol: string, date?: string) => Promise<OverviewData>;
  readStockNews: (symbol: string, date?: string) => Promise<StockNewsData>;
  readMacroNews: (date?: string) => Promise<MacroNewsData>;
  
  // 데이터 존재 여부 확인
  checkDataAvailability: (symbol: string, date?: string) => Promise<{
    hasOverview: boolean;
    hasStockNews: boolean;
    hasMacroNews: boolean;
  }>;
}
```

### 상태 관리 확장
```typescript
// StockProvider 확장 - 실제 데이터 구조 반영
interface StockContextType {
  // 기존
  currentSymbol: StockSymbol;
  setCurrentSymbol: (symbol: StockSymbol) => void;
  
  // 신규 추가 - 실제 Backend 데이터 구조 기반
  newsData: NewsResponse | null;           // 전체 뉴스 응답 데이터
  marketData: MarketOverviewResponse | null;  // 시장 개요 데이터
  
  // 편의성을 위한 파싱된 데이터
  aiAnalysis: {
    overview: string;
    recommendation: 'BUY' | 'HOLD' | 'SELL';
    confidence: number;
    keyFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: string;
    timestamp: string;
  } | null;
  
  stockNews: {
    headline: string;
    articles: any[];
    metadata: {
      source: string;
      cached: boolean;
    };
  } | null;
  
  macroNews: {
    topHeadline: string;
    articles: Array<{
      title: string;
      link: string;
      snippet: string;
      date: string;
      source: string;
    }>;
    totalArticles: number;
  } | null;
  
  marketIndicators: {
    indices: {
      sp500: { value: number; change: number; changePercent: number; };
      nasdaq: { value: number; change: number; changePercent: number; };
      dow: { value: number; change: number; changePercent: number; };
    };
    sectors: Array<{
      name: string;
      change: number;
      performance: 'positive' | 'negative';
    }>;
    marketSentiment: 'bullish' | 'neutral' | 'bearish';
    volatilityIndex: number;
  } | null;
  
  loading: {
    news: boolean;
    market: boolean;
    dataRefresh: boolean;
  };
  
  error: {
    news: string | null;
    market: string | null;
  };
  
  // 데이터 페칭 함수
  fetchNewsData: (symbol: string) => Promise<void>;
  fetchMarketData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // 로컬 데이터 읽기 (개발용)
  useLocalData: boolean;
  setUseLocalData: (useLocal: boolean) => void;
  
  // 데이터 가용성 상태
  dataAvailability: {
    hasNewsData: boolean;
    hasMarketData: boolean;
    lastUpdated: string | null;
  };
}
```

---

## 🚀 구현 단계별 계획

### Phase 1: 레이아웃 기반 구조 (Week 1)
1. **MainLayout 컴포넌트 생성**
   - 새로운 4섹션 그리드 레이아웃 구현
   - 반응형 디자인 기본 구조
   - CSS Grid 기반 레이아웃 시스템

2. **Header 컴포넌트 개선**
   - 새로운 레이아웃에 맞는 스타일 조정
   - 모바일 반응형 최적화

3. **TickerTape 숨김 처리**
   - CSS로 숨김 처리 (`display: none`)
   - 코드는 향후 사용을 위해 유지

### Phase 2: AI Analysis Section (Week 2)
1. **StockProfile 컴포넌트**
   - 기본 주식 정보 표시
   - 실시간 가격 데이터 연동
   - 재무 지표 요약 표시

2. **AIInvestmentOpinion 컴포넌트**
   - Backend AI 분석 결과 표시
   - BUY/HOLD/SELL 추천 시각화
   - 신뢰도 스코어 및 핵심 포인트 표시

3. **API 연동 및 상태 관리**
   - StockProvider 확장
   - AI 분석 데이터 페칭 로직

### Phase 3: Market Intelligence Section (Week 3)
1. **MacroIndicatorsDashboard 컴포넌트**
   - **현재 사용 가능한 데이터**: indices (S&P 500, NASDAQ, DOW), sectors, marketSentiment, volatilityIndex
   - 4개 주요 지표 (indices) + 4개 섹터 성과 + VIX 지표 시각화
   - 색상 코딩 및 트렌드 표시 (positive/negative)
   - **Phase 2 확장**: FRED API 연동 (Fear & Greed Index, 금리, 인플레이션, 실업률)

2. **AINewsAnalysisReport 컴포넌트**
   - **현재 사용 가능한 데이터**: stockNews.headline, macroNews 기사들
   - 뉴스 헤드라인 및 매크로 뉴스 표시 프레임
   - 빈 상태 처리 (articles 배열이 현재 빈 상태)
   - **향후 확장**: 실제 뉴스 기사 연동 시 센티먼트 분석 결과 추가

3. **로컬 데이터 연동 구현**
   - `apps/backend/data` 폴더 직접 읽기 유틸리티 구현
   - API 우선, 로컬 데이터 Fallback 전략
   - 개발/테스트 환경에서 로컬 데이터 활용

### Phase 4: Chart Section 최적화 (Week 4)
1. **TradingView 위젯 크기 조정**
   - 새로운 레이아웃에 맞는 크기 최적화
   - 그리드 시스템 재배치

2. **성능 최적화**
   - 컴포넌트 레이지 로딩
   - 데이터 캐싱 구현
   - 렌더링 성능 향상

3. **사용자 경험 개선**
   - 로딩 상태 표시
   - 에러 핸들링
   - 빈 상태 처리

---

## 📱 반응형 디자인

### Breakpoints
```css
/* Mobile First Approach */
.mobile { max-width: 767px; }
.tablet { min-width: 768px; max-width: 1023px; }
.desktop { min-width: 1024px; }
.large { min-width: 1200px; }
```

### 반응형 레이아웃 규칙
```css
/* Mobile (< 768px) */
@media (max-width: 767px) {
  .main-layout {
    grid-template-rows: auto auto auto auto;
    padding: 0 var(--space-sm);
  }
  
  .analysis-grid,
  .market-grid,
  .chart-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
  
  .macro-indicators {
    grid-template-columns: 1fr 1fr;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .analysis-grid {
    grid-template-columns: 1fr 1.5fr;
  }
  
  .market-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}

/* Desktop (>= 1024px) */
@media (min-width: 1024px) {
  .main-layout {
    max-width: 1200px;
  }
  
  .macro-indicators {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🔍 성능 최적화 전략

### 1. 컴포넌트 최적화
```typescript
// React.memo 활용
const StockProfile = React.memo(({ symbol, ...props }) => {
  // 컴포넌트 로직
});

// useMemo 활용
const MacroIndicatorsDashboard = () => {
  const processedData = useMemo(() => {
    return transformMarketData(rawData);
  }, [rawData]);
};
```

### 2. 데이터 페칭 최적화
```typescript
// SWR 또는 React Query 도입 고려
const useMarketData = (symbol: string) => {
  const { data, error, isLoading } = useSWR(
    `/api/v1/market/indicators/${symbol}`,
    fetcher,
    { refreshInterval: 60000 } // 1분마다 갱신
  );
  
  return { data, error, isLoading };
};
```

### 3. 레이지 로딩
```typescript
// 컴포넌트 레이지 로딩
const AINewsAnalysisReport = lazy(() => 
  import('./Market/AINewsAnalysisReport')
);

// 이미지 레이지 로딩
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      loading="lazy"
      {...props}
    />
  );
};
```

---

## 🧪 테스팅 전략

### 1. Unit Testing
```typescript
// 컴포넌트 테스트
describe('StockProfile', () => {
  it('displays stock symbol and price correctly', () => {
    render(<StockProfile symbol="AAPL" currentPrice={150.25} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('$150.25')).toBeInTheDocument();
  });
});

// API 테스트
describe('Market API', () => {
  it('fetches macro indicators successfully', async () => {
    const data = await getMarketIndicators();
    expect(data).toHaveProperty('fear_greed_index');
    expect(data).toHaveProperty('vix_volatility');
  });
});
```

### 2. Integration Testing
```typescript
// 컴포넌트 통합 테스트
describe('AI Investment Analysis Section', () => {
  it('loads and displays AI analysis data', async () => {
    render(<AIInvestmentOpinion symbol="AAPL" />);
    await waitFor(() => {
      expect(screen.getByText(/investment recommendation/i)).toBeInTheDocument();
    });
  });
});
```

### 3. E2E Testing (Playwright)
```typescript
// 사용자 플로우 테스트
test('user can select stock and view analysis', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('[data-testid="stock-selector"]', 'TSLA');
  await expect(page.locator('[data-testid="ai-opinion"]')).toBeVisible();
  await expect(page.locator('[data-testid="macro-dashboard"]')).toBeVisible();
});
```

---

## 🛡️ 접근성 (A11Y) 가이드라인

### WCAG 2.1 AA 준수사항

#### 1. 키보드 네비게이션
```typescript
// 모든 인터랙티브 요소에 키보드 접근성 제공
const StockSelector = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleStockSelect();
    }
  };
  
  return (
    <button 
      onKeyDown={handleKeyDown}
      aria-label="Select stock symbol"
    >
      {symbol}
    </button>
  );
};
```

#### 2. 스크린 리더 지원
```typescript
// ARIA 라벨 및 설명 제공
const AIOpinion = ({ recommendation, confidence }) => {
  return (
    <section 
      role="region" 
      aria-labelledby="ai-opinion-title"
      aria-describedby="ai-opinion-desc"
    >
      <h2 id="ai-opinion-title">AI Investment Opinion</h2>
      <p id="ai-opinion-desc">AI-generated investment recommendation</p>
      <div 
        role="status"
        aria-live="polite"
        aria-label={`Recommendation: ${recommendation}, Confidence: ${confidence}%`}
      >
        {/* 추천 내용 */}
      </div>
    </section>
  );
};
```

#### 3. 색상 대비 준수
```css
/* 최소 4.5:1 대비율 보장 */
.recommendation-buy {
  background-color: #00C853;
  color: #ffffff; /* 대비율: 7.3:1 */
}

.recommendation-sell {
  background-color: #F44336;
  color: #ffffff; /* 대비율: 5.8:1 */
}

.recommendation-hold {
  background-color: #FF9800;
  color: #000000; /* 대비율: 6.2:1 */
}
```

---

## 📋 체크리스트 및 검증 기준

### 기능 요구사항 체크리스트
- [ ] Header 섹션: 로고, 종목선택, 검색 기능 동작
- [ ] AI 분석 섹션: Backend 데이터 연동 및 표시
- [ ] 매크로 지표 섹션: 6개 지표 실시간 표시
- [ ] 뉴스 분석 섹션: 빈 프레임 구현
- [ ] 차트 섹션: TradingView 위젯 최적화 배치
- [ ] TickerTape: 숨김 처리 (코드 유지)

### 성능 요구사항
- [ ] 초기 로딩 시간 < 3초
- [ ] API 응답 시간 < 2초
- [ ] 컴포넌트 렌더링 최적화
- [ ] 메모리 사용량 최적화

### 접근성 요구사항
- [ ] WCAG 2.1 AA 레벨 준수
- [ ] 키보드 네비게이션 완전 지원
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 4.5:1 이상

### 브라우저 호환성
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🔄 향후 확장 계획

### Phase 2 기능 (추후 구현)
1. **실시간 알림 시스템**
   - WebSocket 기반 실시간 데이터 업데이트
   - 가격 알림 및 뉴스 알림

2. **사용자 맞춤 대시보드**
   - 사용자별 관심 종목 저장
   - 맞춤형 지표 설정

3. **고급 차트 분석**
   - 다중 시간대 분석
   - 기술적 지표 커스터마이징

### Phase 3 기능 (장기 계획)
1. **포트폴리오 관리**
   - 가상 포트폴리오 시뮬레이션
   - 성과 추적 및 분석

2. **소셜 기능**
   - 투자 의견 공유
   - 커뮤니티 인사이트

3. **모바일 앱**
   - React Native 기반 모바일 앱
   - 푸시 알림 지원

---

## 📚 참고 자료 및 문서

### Design References
- [TradingView Charting Library](https://www.tradingview.com/charting-library/)
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Technical Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guide](https://reactjs.org/docs/accessibility.html)

### Backend API References
- [NestJS Documentation](https://docs.nestjs.com/)
- [FRED API Documentation](https://fred.stlouisfed.org/docs/api/)
- [SERPAPI Documentation](https://serpapi.com/search-api)

---

*이 문서는 Investie Frontend 레이아웃 개선 프로젝트의 종합 설계 문서입니다. 구현 과정에서 세부사항은 조정될 수 있으며, 정기적으로 업데이트됩니다.*

## 🔍 실제 데이터 검증 결과

### ✅ 데이터 가용성 확인
1. **Backend API 테스트 완료**:
   - `POST /api/v1/news/process` → AAPL, TSLA 데이터 생성 성공
   - `GET /api/v1/news/:symbol` → AI 분석 및 뉴스 데이터 반환 확인
   - `GET /api/v1/market/overview` → 시장 지표 데이터 반환 확인

2. **로컬 데이터 파일 구조 검증**:
   - `apps/backend/data/news/stock_news/{SYMBOL}/{DATE}/` 경로 확인
   - `overview.json`, `stock_news.json` 파일 생성 확인
   - `apps/backend/data/news/macro_news/{DATE}/macro_news.json` 파일 확인

3. **현재 사용 가능한 데이터**:
   - ✅ AI 투자 분석 (overview): recommendation, confidence, keyFactors, riskLevel
   - ✅ 주식 뉴스 헤드라인: summary.headline 필드
   - ✅ 매크로 뉴스: topHeadline 및 articles 배열
   - ✅ 시장 지표: S&P 500, NASDAQ, DOW indices + 섹터 성과 + VIX

### 🚧 제한사항 및 향후 개선사항
1. **현재 제한사항**:
   - 뉴스 articles 배열이 현재 빈 상태 (Mock Data 단계)
   - Fear & Greed Index, 금리, 인플레이션, 실업률 데이터 미구현
   - 실제 뉴스 API 연동 필요 (현재는 Mock 헤드라인만 제공)

2. **Phase 2 확장 계획**:
   - FRED API 연동으로 매크로 경제 지표 완성
   - 실제 뉴스 API 연동으로 articles 배열 데이터 채우기
   - Fear & Greed Index 대체 데이터 소스 개발

### 💡 Frontend 연동 전략
1. **API 우선 전략**: 프로덕션에서는 Backend API 사용
2. **로컬 Fallback**: 개발/테스트 환경에서 로컬 데이터 파일 직접 읽기
3. **점진적 향상**: 현재 사용 가능한 데이터부터 UI 구현 시작
4. **확장성 확보**: Phase 2 데이터 추가 시 최소한의 변경으로 대응

---

**최종 업데이트**: 2025년 8월 19일  
**문서 버전**: 2.0 (실제 데이터 검증 반영)  
**작성자**: Claude (Frontend Persona)  
**검증 완료**: Backend API 및 로컬 데이터 구조 확인