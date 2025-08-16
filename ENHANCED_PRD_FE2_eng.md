# 📋 Investie Frontend 2 (FE2) - Enhanced UI/UX Development PRD

**Role**: Frontend 2 (FE2 - UI/UX & Layout)  
**Expertise**: Layout, Components, Data Display, User Experience  
**Development Environment**: Next.js 15.4.6 + React 19 + TypeScript + Tailwind CSS 4  

---

## 🎯 Current Implementation Status Analysis

### ✅ **Existing Implementation (Ready to Use)**

#### **Backend APIs (Production Ready)**
- ✅ **Stocks API**: `/api/v1/stocks` - Complete stock data
- ✅ **Market API**: `/api/v1/market/overview` - Market overview data
- ✅ **AI API**: `/api/v1/ai/health`, `/api/v1/ai/stats` - AI service status
- ✅ **News API**: `/api/v1/news/health` - News service status
- ✅ **CORS Configuration**: Frontend-backend integration complete

#### **Frontend Foundation**
- ✅ **Next.js Project**: Production build ready
- ✅ **TypeScript Type System**: `/src/types/api.ts`
- ✅ **API Client**: `/src/lib/api.ts`
- ✅ **Basic Layout**: Header, Footer components
- ✅ **TradingView Integration**: 7 widgets fully implemented
- ✅ **Stock Selection System**: StockProvider context

#### **Existing Components (Reusable)**
```
src/app/components/
├── Header.tsx              # ✅ Stock selector + search
├── Footer.tsx              # ✅ Basic footer
├── StockProvider.tsx       # ✅ Global state management
└── TradingView/            # ✅ 7 widgets (fully implemented)
    ├── TickerTape.tsx      # Top ticker
    ├── SymbolInfo.tsx      # Stock info
    ├── AdvancedChart.tsx   # Chart
    ├── TechnicalAnalysis.tsx
    ├── CompanyProfile.tsx
    ├── FundamentalData.tsx
    └── TopStories.tsx
```

---

## 🚀 Phase 1: Core Data Display Components Implementation

### **1.1 Market Summary Card (MarketSummaryCard)**

**Goal**: Create market overview card utilizing backend API data

#### **Data Source**
```typescript
// Backend API utilization
GET /api/v1/market/overview
Response: {
  indices: { sp500, nasdaq, dow },
  sectors: [{ name, change, performance }],
  marketSentiment: string,
  volatilityIndex: number
}
```

#### **Component Structure**
```tsx
// src/app/components/cards/MarketSummaryCard.tsx
interface MarketSummaryCardProps {
  data: MarketOverview;
  className?: string;
}

export function MarketSummaryCard({ data, className }: MarketSummaryCardProps) {
  return (
    <div className={`market-summary-card ${className}`}>
      {/* Major Indices (S&P500, NASDAQ, DOW) */}
      <IndexGrid indices={data.indices} />
      
      {/* Sector Performance */}
      <SectorPerformance sectors={data.sectors} />
      
      {/* Market Sentiment Indicators */}
      <MarketSentiment 
        sentiment={data.marketSentiment}
        vix={data.volatilityIndex}
      />
    </div>
  );
}
```

#### **Sub-components**
1. **`IndexGrid`**: Display major indices (S&P 500, NASDAQ, DOW)
2. **`SectorPerformance`**: Sector performance charts
3. **`MarketSentiment`**: Market sentiment + VIX index visualization

#### **Styling Requirements**
- **Card Design**: Rounded corners, shadows, background color differentiation
- **Color System**: Up (green), down (red), neutral (gray)
- **Responsive Design**: Vertical layout on mobile, horizontal on desktop
- **Animations**: Smooth transitions during data loading

### **1.2 Enhanced Stock Card (StockCard)**

**Goal**: Comprehensive stock card utilizing backend's complete stock data

#### **Data Source**
```typescript
// Backend API utilization
GET /api/v1/stocks/:symbol
Response: StockCardData {
  symbol, name, price, fundamentals,
  technicals, aiEvaluation, newsSummary,
  sectorPerformance
}
```

#### **Component Structure**
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
      {/* Header: Symbol + Company Name + Price */}
      <StockHeader 
        symbol={data.symbol}
        name={data.name}
        price={data.price}
      />
      
      {!compact && (
        <>
          {/* AI Evaluation Section */}
          <AIEvaluationSection evaluation={data.aiEvaluation} />
          
          {/* Fundamentals */}
          <FundamentalsSection fundamentals={data.fundamentals} />
          
          {/* Technical Analysis */}
          <TechnicalSection technicals={data.technicals} />
          
          {/* News Summary */}
          <NewsSection news={data.newsSummary} />
          
          {/* Sector Performance */}
          <SectorSection sector={data.sectorPerformance} />
        </>
      )}
    </div>
  );
}
```

#### **Sub-components**
1. **`StockHeader`**: Symbol, company name, current price, change percentage
2. **`AIEvaluationSection`**: AI evaluation (rating, confidence, keyFactors)
3. **`FundamentalsSection`**: P/E, market cap, volume, 52-week range
4. **`TechnicalSection`**: RSI, technical indicators
5. **`NewsSection`**: News headline, sentiment analysis
6. **`SectorSection`**: Sector info, weekly change

### **1.3 Stock List Container (StockGrid)**

**Goal**: Efficient grid system for displaying multiple stock cards

#### **Component Structure**
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

#### **Layout Options**
1. **Grid**: 2-3 columns on desktop, 1 column on mobile
2. **List**: Vertical list (simplified info)
3. **Carousel**: Horizontal scroll (mobile optimized)

---

## 🎨 Phase 2: Advanced UI/UX Implementation

### **2.1 Responsive Layout System**

#### **Breakpoint Definition**
```css
/* globals.css */
:root {
  --mobile-max: 768px;
  --tablet-max: 1024px;
  --desktop-min: 1025px;
}

/* Layout Grid */
.main-layout {
  display: grid;
  gap: var(--gap-size);
  padding: 1rem;
}

/* Mobile */
@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "market-summary"
      "stock-list"
      "trading-tools";
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .main-layout {
    grid-template-columns: 1fr 300px 300px;
    grid-template-areas: 
      "main-content watchlist chatbot"
      "main-content watchlist chatbot";
  }
}
```

### **2.2 Enhanced State Management**

#### **Global State Structure**
```tsx
// src/contexts/AppContext.tsx
interface AppState {
  // Currently selected stock
  currentSymbol: StockSymbol;
  
  // Watchlist (expand after login)
  watchlist: StockSymbol[];
  
  // UI State
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    layout: 'grid' | 'list';
  };
  
  // Data Cache
  cache: {
    stocks: Record<string, StockCardData>;
    marketSummary: MarketOverview | null;
  };
}
```

### **2.3 Loading and Error States**

#### **Skeleton Loaders**
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

#### **Error Boundaries**
```tsx
// src/app/components/ui/ErrorBoundary.tsx
export function StockCardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="stock-card stock-card--error">
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Data Load Failed
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {error.message || 'Unable to load stock data.'}
        </p>
        <button 
          onClick={retry}
          className="btn btn--primary btn--sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

---

## 🔧 Phase 3: Advanced Features Implementation

### **3.1 Real-time Data Updates**

#### **Polling System**
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
        console.error('Real-time data update failed:', error);
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  return { data, loading };
}
```

### **3.2 Search and Filtering**

#### **Advanced Search Component**
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
        console.error('Search failed:', error);
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
        placeholder={placeholder || 'Search stocks...'}
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

### **3.3 Data Visualization Components**

#### **Mini Chart Component**
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

## 🎯 Phase 4: User Experience Optimization

### **4.1 Performance Optimization**

#### **Memoization and Lazy Loading**
```tsx
// Prevent unnecessary re-renders with React.memo
export const StockCard = memo(({ symbol, compact }: StockCardProps) => {
  // Component content
});

// Component lazy loading
const AIEvaluationSection = lazy(() => 
  import('./AIEvaluationSection').then(module => ({ 
    default: module.AIEvaluationSection 
  }))
);
```

#### **Image Optimization**
```tsx
import Image from 'next/image';

// Utilize Next.js Image component
<Image
  src={`/api/company-logos/${symbol}.svg`}
  alt={`${symbol} logo`}
  width={32}
  height={32}
  className="company-logo"
  priority={false}
/>
```

### **4.2 Accessibility Improvements**

#### **Keyboard Navigation**
```tsx
// Handle keyboard events
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
        // Navigate to selected stock
        break;
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown} role="grid">
      {/* Grid content */}
    </div>
  );
}
```

#### **ARIA Labels and Semantic Markup**
```tsx
<div 
  role="article"
  aria-label={`${symbol} stock information`}
  className="stock-card"
>
  <h3 id={`${symbol}-title`}>{name}</h3>
  <div aria-describedby={`${symbol}-title`}>
    {/* Price information */}
  </div>
</div>
```

---

## 🛠️ Required Backend Additions

### **Immediately Needed API Endpoints**

#### **1. Stock Search API** 
```typescript
// Need: Stock search functionality
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

#### **2. Batch Stock Data API** 
```typescript
// Need: Multiple stocks query at once
POST /api/v1/stocks/batch
Body: { symbols: StockSymbol[] }
Response: {
  success: boolean;
  data: Record<StockSymbol, StockCardData>;
  timestamp: string;
}
```

#### **3. Chart Data API** 
```typescript
// Already exists but needs expansion
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

### **Phase 2+ Required APIs (User Features)**

#### **4. User Authentication API**
```typescript
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
```

#### **5. Watchlist API**
```typescript
GET    /api/v1/user/watchlist
POST   /api/v1/user/watchlist
DELETE /api/v1/user/watchlist/:symbol
PUT    /api/v1/user/watchlist/order
```

---

## 📱 Mobile Optimization Requirements

### **Touch Interface**
- **Minimum Touch Area**: 44px × 44px
- **Swipe Gestures**: Card-to-card navigation
- **Pull-to-Refresh**: Data updates

### **Performance Considerations**
- **Initial Loading**: Under 3 seconds
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Under 200KB (gzipped)

---

## 📊 Success Metrics (KPIs)

### **User Experience**
- **Page Load Time**: < 2 seconds
- **Interaction Response Time**: < 100ms
- **Mobile Usability Score**: > 90 points

### **Development Quality**
- **TypeScript Coverage**: 95% or higher
- **Component Reusability**: 80% or higher
- **Accessibility Score**: AA grade or higher

---

## 🎯 Development Priorities

### **Week 1: Core Data Display**
1. MarketSummaryCard implementation
2. Enhanced StockCard implementation
3. StockGrid container implementation
4. Basic responsive layout

### **Week 2: Advanced UI/UX**
1. Loading/error states implementation
2. Real-time data updates
3. Search and filtering functionality
4. Data visualization components

### **Week 3: Performance and Accessibility**
1. Performance optimization (memoization, lazy loading)
2. Accessibility improvements (keyboard, ARIA)
3. Mobile optimization
4. User testing and feedback integration

---

## 🔗 Technology Stack Utilization

### **Currently In Use**
- **Next.js 15.4.6**: App Router, Static Generation
- **React 19**: Hooks, Context, Suspense
- **TypeScript**: Strong typing system
- **Tailwind CSS 4**: Utility-based styling

### **Additional Recommended Libraries**
```json
{
  "dependencies": {
    "clsx": "^2.0.0",           // Conditional classnames
    "lucide-react": "^0.300.0", // Icon system
    "date-fns": "^3.0.0",       // Date handling
    "framer-motion": "^10.0.0"  // Animations (optional)
  }
}
```

---

## ✅ Completion Checklist

### **Phase 1 Completion Criteria**
- [ ] MarketSummaryCard backend API integration complete
- [ ] StockCard all fields display complete
- [ ] StockGrid 3 layout types implementation complete
- [ ] Mobile/desktop responsive layout complete
- [ ] Loading/error state handling complete

### **Phase 2 Completion Criteria**  
- [ ] Real-time data update system implemented
- [ ] Advanced search and filtering functionality complete
- [ ] Mini charts and data visualization complete
- [ ] Performance optimization (< 2sec loading) achieved
- [ ] Accessibility AA grade achieved

### **Final Completion Criteria**
- [ ] All 10 stocks fully displayed
- [ ] Cross-browser testing passed
- [ ] Mobile usability testing passed
- [ ] Production deployment ready

---

*This PRD is designed to maximize utilization of the currently implemented backend APIs and frontend foundation, enabling FE2 developers to efficiently implement high-quality UI/UX.*