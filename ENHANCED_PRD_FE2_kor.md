# 📋 Investie Frontend 2 (FE2) - 강화된 UI/UX 개발 PRD

**역할**: 프론트엔드 2 (FE2 - UI/UX & 레이아웃)  
**전문 분야**: 레이아웃, 컴포넌트, 데이터 표시, 사용자 경험  
**개발 환경**: Next.js 15.4.6 + React 19 + TypeScript + Tailwind CSS 4  

---

## 🎯 현재 구현 상태 분석

### ✅ **기존 구현 완료 (활용 가능)**

#### **백엔드 API (Production Ready)**
- ✅ **Stocks API**: `/api/v1/stocks` - 완전한 주식 데이터
- ✅ **Market API**: `/api/v1/market/overview` - 시장 개요 데이터
- ✅ **AI API**: `/api/v1/ai/health`, `/api/v1/ai/stats` - AI 서비스 상태
- ✅ **News API**: `/api/v1/news/health` - 뉴스 서비스 상태
- ✅ **CORS 설정**: 프론트엔드-백엔드 통합 완료

#### **프론트엔드 기반 구조**
- ✅ **Next.js 프로젝트**: 프로덕션 빌드 가능
- ✅ **TypeScript 타입 시스템**: `/src/types/api.ts`
- ✅ **API 클라이언트**: `/src/lib/api.ts`
- ✅ **기본 레이아웃**: Header, Footer 컴포넌트
- ✅ **TradingView 통합**: 7개 위젯 완전 구현
- ✅ **주식 선택 시스템**: StockProvider 컨텍스트

#### **기존 컴포넌트 (재활용 가능)**
```
src/app/components/
├── Header.tsx              # ✅ 주식 선택기 + 검색
├── Footer.tsx              # ✅ 기본 푸터
├── StockProvider.tsx       # ✅ 전역 상태 관리
└── TradingView/            # ✅ 7개 위젯 (완전 구현)
    ├── TickerTape.tsx      # 상단 티커
    ├── SymbolInfo.tsx      # 주식 정보
    ├── AdvancedChart.tsx   # 차트
    ├── TechnicalAnalysis.tsx
    ├── CompanyProfile.tsx
    ├── FundamentalData.tsx
    └── TopStories.tsx
```

---

## 🚀 Phase 1: 핵심 데이터 표시 컴포넌트 구현

### **1.1 시장 요약 카드 (MarketSummaryCard)**

**목표**: 백엔드 API 데이터를 활용한 시장 개요 카드 생성

#### **데이터 소스**
```typescript
// 백엔드 API 활용
GET /api/v1/market/overview
Response: {
  indices: { sp500, nasdaq, dow },
  sectors: [{ name, change, performance }],
  marketSentiment: string,
  volatilityIndex: number
}
```

#### **컴포넌트 구조**
```tsx
// src/app/components/cards/MarketSummaryCard.tsx
interface MarketSummaryCardProps {
  data: MarketOverview;
  className?: string;
}

export function MarketSummaryCard({ data, className }: MarketSummaryCardProps) {
  return (
    <div className={`market-summary-card ${className}`}>
      {/* 주요 지수 (S&P500, NASDAQ, DOW) */}
      <IndexGrid indices={data.indices} />
      
      {/* 섹터 성과 */}
      <SectorPerformance sectors={data.sectors} />
      
      {/* 시장 심리 지표 */}
      <MarketSentiment 
        sentiment={data.marketSentiment}
        vix={data.volatilityIndex}
      />
    </div>
  );
}
```

#### **하위 컴포넌트**
1. **`IndexGrid`**: 주요 지수 표시 (S&P 500, NASDAQ, DOW)
2. **`SectorPerformance`**: 섹터별 성과 차트
3. **`MarketSentiment`**: 시장 심리 + VIX 지수 시각화

#### **스타일링 요구사항**
- **카드 디자인**: 둥근 모서리, 그림자, 배경색 구분
- **색상 시스템**: 상승(초록), 하락(빨강), 중립(회색)
- **반응형 디자인**: 모바일에서 세로 배치, 데스크톱에서 가로 배치
- **애니메이션**: 데이터 로딩 시 부드러운 전환 효과

### **1.2 개선된 주식 카드 (StockCard)**

**목표**: 백엔드의 완전한 주식 데이터를 활용한 포괄적 주식 카드

#### **데이터 소스**
```typescript
// 백엔드 API 활용
GET /api/v1/stocks/:symbol
Response: StockCardData {
  symbol, name, price, fundamentals,
  technicals, aiEvaluation, newsSummary,
  sectorPerformance
}
```

#### **컴포넌트 구조**
```tsx
// src/app/components/cards/StockCard.tsx
interface StockCardProps {
  symbol: StockSymbol;
  compact?: boolean;
  className?: string;
}

export function StockCard({ symbol, compact, className }: StockCardProps) {
  const { data, loading, error } = useStock(symbol);
  
  if (loading) return <StockCardSkeleton />;
  if (error) return <StockCardError error={error} />;
  
  return (
    <div className={`stock-card ${compact ? 'compact' : 'full'} ${className}`}>
      {/* 헤더: 심볼 + 회사명 + 가격 */}
      <StockHeader 
        symbol={data.symbol}
        name={data.name}
        price={data.price}
      />
      
      {!compact && (
        <>
          {/* AI 평가 섹션 */}
          <AIEvaluationSection evaluation={data.aiEvaluation} />
          
          {/* 기본 지표 */}
          <FundamentalsSection fundamentals={data.fundamentals} />
          
          {/* 기술적 분석 */}
          <TechnicalSection technicals={data.technicals} />
          
          {/* 뉴스 요약 */}
          <NewsSection news={data.newsSummary} />
          
          {/* 섹터 성과 */}
          <SectorSection sector={data.sectorPerformance} />
        </>
      )}
    </div>
  );
}
```

#### **하위 컴포넌트**
1. **`StockHeader`**: 심볼, 회사명, 현재가, 변동률
2. **`AIEvaluationSection`**: AI 평가 (rating, confidence, keyFactors)
3. **`FundamentalsSection`**: P/E, 시가총액, 거래량, 52주 범위
4. **`TechnicalSection`**: RSI, 기술적 지표
5. **`NewsSection`**: 뉴스 헤드라인, 감정 분석
6. **`SectorSection`**: 섹터 정보, 주간 변동

### **1.3 주식 목록 컨테이너 (StockGrid)**

**목표**: 여러 주식 카드를 효율적으로 표시하는 그리드 시스템

#### **컴포넌트 구조**
```tsx
// src/app/components/containers/StockGrid.tsx
interface StockGridProps {
  symbols: StockSymbol[];
  layout: 'grid' | 'list' | 'carousel';
  cardType: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function StockGrid({ symbols, layout, cardType, className }: StockGridProps) {
  return (
    <div className={`stock-grid stock-grid--${layout} ${className}`}>
      {symbols.map(symbol => (
        <StockCard 
          key={symbol}
          symbol={symbol}
          compact={cardType !== 'full'}
          className={`stock-grid__item stock-grid__item--${cardType}`}
        />
      ))}
    </div>
  );
}
```

#### **레이아웃 옵션**
1. **Grid**: 데스크톱 2-3열, 모바일 1열
2. **List**: 세로 목록 (간단한 정보)
3. **Carousel**: 가로 스크롤 (모바일 최적화)

---

## 🎨 Phase 2: 고급 UI/UX 구현

### **2.1 반응형 레이아웃 시스템**

#### **브레이크포인트 정의**
```css
/* globals.css */
:root {
  --mobile-max: 768px;
  --tablet-max: 1024px;
  --desktop-min: 1025px;
}

/* 레이아웃 그리드 */
.main-layout {
  display: grid;
  gap: var(--gap-size);
  padding: 1rem;
}

/* 모바일 */
@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "market-summary"
      "stock-list"
      "trading-tools";
  }
}

/* 데스크톱 */
@media (min-width: 1025px) {
  .main-layout {
    grid-template-columns: 1fr 300px 300px;
    grid-template-areas: 
      "main-content watchlist chatbot"
      "main-content watchlist chatbot";
  }
}
```

### **2.2 상태 관리 개선**

#### **전역 상태 구조**
```tsx
// src/contexts/AppContext.tsx
interface AppState {
  // 현재 선택된 주식
  currentSymbol: StockSymbol;
  
  // 관심종목 (로그인 후 확장)
  watchlist: StockSymbol[];
  
  // UI 상태
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    layout: 'grid' | 'list';
  };
  
  // 데이터 캐시
  cache: {
    stocks: Record<string, StockCardData>;
    marketSummary: MarketOverview | null;
  };
}
```

### **2.3 로딩 및 에러 상태**

#### **스켈레톤 로더**
```tsx
// src/app/components/ui/SkeletonCard.tsx
export function StockCardSkeleton() {
  return (
    <div className="stock-card animate-pulse">
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-4"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  );
}

export function MarketSummarySkeleton() {
  return (
    <div className="market-summary-card animate-pulse">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

#### **에러 바운더리**
```tsx
// src/app/components/ui/ErrorBoundary.tsx
export function StockCardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="stock-card stock-card--error">
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          데이터 로드 실패
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {error.message || '주식 데이터를 불러올 수 없습니다.'}
        </p>
        <button 
          onClick={retry}
          className="btn btn--primary btn--sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
```

---

## 🔧 Phase 3: 고급 기능 구현

### **3.1 실시간 데이터 업데이트**

#### **폴링 시스템**
```tsx
// src/hooks/useRealTimeData.tsx
export function useRealTimeData(symbol: StockSymbol) {
  const [data, setData] = useState<StockCardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const stockData = await getStock(symbol);
        setData(stockData);
      } catch (error) {
        console.error('실시간 데이터 업데이트 실패:', error);
      }
    }, 30000); // 30초마다 업데이트
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  return { data, loading };
}
```

### **3.2 검색 및 필터링**

#### **고급 검색 컴포넌트**
```tsx
// src/app/components/search/StockSearch.tsx
interface StockSearchProps {
  onSelect: (symbol: StockSymbol) => void;
  placeholder?: string;
}

export function StockSearch({ onSelect, placeholder }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockCardData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) return;
      
      try {
        const stocks = await searchStocks(searchQuery);
        setResults(stocks);
        setIsOpen(true);
      } catch (error) {
        console.error('검색 실패:', error);
      }
    }, 300),
    []
  );
  
  return (
    <div className="stock-search">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder={placeholder || '주식 검색...'}
        className="search-input"
      />
      
      {isOpen && results.length > 0 && (
        <SearchResults 
          results={results}
          onSelect={onSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

### **3.3 데이터 시각화 컴포넌트**

#### **미니 차트 컴포넌트**
```tsx
// src/app/components/charts/MiniChart.tsx
interface MiniChartProps {
  data: number[];
  trend: 'up' | 'down' | 'flat';
  className?: string;
}

export function MiniChart({ data, trend, className }: MiniChartProps) {
  const color = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
  
  return (
    <div className={`mini-chart ${className}`}>
      <svg width="100" height="30" viewBox="0 0 100 30">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={generatePoints(data)}
        />
      </svg>
    </div>
  );
}

function generatePoints(data: number[]): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 30 - ((value - min) / range) * 30;
    return `${x},${y}`;
  }).join(' ');
}
```

---

## 🎯 Phase 4: 사용자 경험 최적화

### **4.1 성능 최적화**

#### **메모이제이션 및 지연 로딩**
```tsx
// React.memo로 불필요한 리렌더링 방지
export const StockCard = memo(({ symbol, compact }: StockCardProps) => {
  // 컴포넌트 내용
});

// 컴포넌트 지연 로딩
const AIEvaluationSection = lazy(() => 
  import('./AIEvaluationSection').then(module => ({ 
    default: module.AIEvaluationSection 
  }))
);
```

#### **이미지 최적화**
```tsx
import Image from 'next/image';

// Next.js Image 컴포넌트 활용
<Image
  src={`/api/company-logos/${symbol}.svg`}
  alt={`${symbol} logo`}
  width={32}
  height={32}
  className="company-logo"
  priority={false}
/>
```

### **4.2 접근성 향상**

#### **키보드 네비게이션**
```tsx
// 키보드 이벤트 처리
export function StockGrid({ symbols }: StockGridProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        setFocusedIndex(Math.min(focusedIndex + 1, symbols.length - 1));
        break;
      case 'ArrowLeft':
        setFocusedIndex(Math.max(focusedIndex - 1, 0));
        break;
      case 'Enter':
        // 선택된 주식으로 이동
        break;
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown} role="grid">
      {/* 그리드 내용 */}
    </div>
  );
}
```

#### **ARIA 레이블 및 시맨틱 마크업**
```tsx
<div 
  role="article"
  aria-label={`${symbol} 주식 정보`}
  className="stock-card"
>
  <h3 id={`${symbol}-title`}>{name}</h3>
  <div aria-describedby={`${symbol}-title`}>
    {/* 가격 정보 */}
  </div>
</div>
```

---

## 🛠️ 필요한 백엔드 추가 구현

### **즉시 필요한 API 엔드포인트**

#### **1. 검색 API** 
```typescript
// 필요: 주식 검색 기능
GET /api/v1/stocks/search?q={query}&limit=10
Response: {
  success: boolean;
  data: StockSearchResult[];
  timestamp: string;
}

interface StockSearchResult {
  symbol: StockSymbol;
  name: string;
  sector: string;
  marketCap: number;
  price: number;
}
```

#### **2. 복수 주식 데이터 API** 
```typescript
// 필요: 여러 주식 한번에 조회
POST /api/v1/stocks/batch
Body: { symbols: StockSymbol[] }
Response: {
  success: boolean;
  data: Record<StockSymbol, StockCardData>;
  timestamp: string;
}
```

#### **3. 차트 데이터 API** 
```typescript
// 이미 존재하지만 확장 필요
GET /api/v1/stocks/:symbol/chart?period=1D&points=100
Response: {
  success: boolean;
  data: {
    symbol: StockSymbol;
    period: string;
    data: Array<{ timestamp: string; price: number; volume?: number }>;
  };
  timestamp: string;
}
```

### **Phase 2 이후 필요한 API (사용자 기능)**

#### **4. 사용자 인증 API**
```typescript
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
```

#### **5. 관심종목 API**
```typescript
GET    /api/v1/user/watchlist
POST   /api/v1/user/watchlist
DELETE /api/v1/user/watchlist/:symbol
PUT    /api/v1/user/watchlist/order
```

---

## 📱 모바일 최적화 요구사항

### **터치 인터페이스**
- **최소 터치 영역**: 44px × 44px
- **스와이프 제스처**: 카드 간 이동
- **풀다운 새로고침**: 데이터 업데이트

### **성능 고려사항**
- **초기 로딩**: 3초 이내
- **이미지 최적화**: WebP 포맷, 지연 로딩
- **번들 크기**: 200KB 이하 (gzipped)

---

## 📊 성공 지표 (KPI)

### **사용자 경험**
- **페이지 로드 시간**: < 2초
- **상호작용 응답 시간**: < 100ms
- **모바일 사용성 점수**: > 90점

### **개발 품질**
- **TypeScript 커버리지**: 95% 이상
- **컴포넌트 재사용률**: 80% 이상
- **접근성 점수**: AA 등급 이상

---

## 🎯 개발 우선순위

### **Week 1: 핵심 데이터 표시**
1. MarketSummaryCard 구현
2. 향상된 StockCard 구현
3. StockGrid 컨테이너 구현
4. 기본 반응형 레이아웃

### **Week 2: 고급 UI/UX**
1. 로딩/에러 상태 구현
2. 실시간 데이터 업데이트
3. 검색 및 필터링 기능
4. 데이터 시각화 컴포넌트

### **Week 3: 성능 및 접근성**
1. 성능 최적화 (메모이제이션, 지연 로딩)
2. 접근성 향상 (키보드, ARIA)
3. 모바일 최적화
4. 사용자 테스트 및 피드백 반영

---

## 🔗 기술 스택 활용

### **현재 사용 중**
- **Next.js 15.4.6**: App Router, Static Generation
- **React 19**: Hooks, Context, Suspense
- **TypeScript**: 강타입 시스템
- **Tailwind CSS 4**: 유틸리티 기반 스타일링

### **추가 권장 라이브러리**
```json
{
  "dependencies": {
    "clsx": "^2.0.0",           // 조건부 클래스명
    "lucide-react": "^0.300.0", // 아이콘 시스템
    "date-fns": "^3.0.0",       // 날짜 처리
    "framer-motion": "^10.0.0"  // 애니메이션 (선택사항)
  }
}
```

---

## ✅ 완료 체크리스트

### **Phase 1 완료 조건**
- [ ] MarketSummaryCard 백엔드 API 연동 완료
- [ ] StockCard 모든 필드 표시 완료
- [ ] StockGrid 3가지 레이아웃 구현 완료
- [ ] 모바일/데스크톱 반응형 레이아웃 완료
- [ ] 로딩/에러 상태 처리 완료

### **Phase 2 완료 조건**  
- [ ] 실시간 데이터 업데이트 시스템 구현
- [ ] 고급 검색 및 필터링 기능 완료
- [ ] 미니 차트 및 데이터 시각화 완료
- [ ] 성능 최적화 (< 2초 로딩) 달성
- [ ] 접근성 AA 등급 달성

### **최종 완료 조건**
- [ ] 모든 10개 주식 완전 표시
- [ ] 크로스 브라우저 테스트 통과
- [ ] 모바일 사용성 테스트 통과
- [ ] 프로덕션 배포 준비 완료

---

*이 PRD는 현재 구현된 백엔드 API와 프론트엔드 기반 구조를 최대한 활용하여, FE2 개발자가 효율적으로 고품질 UI/UX를 구현할 수 있도록 설계되었습니다.*