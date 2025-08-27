# Investie Platform - Frontend & Br to complete the platform's core functionality and enhance the user experience.

## Current Issues Analysis

### 1. Backend API Endpoint Mismatch

**Problem**: Frontend components expect specific API endpoints that don't exist in the backend.

**Affected Components**:
- **AI Investment Opinion**: Calls `/api/v1/dashboard/${symbol}/ai-analysis` (❌ Not implemented)
- **Stock Profile**: Calls `/api/v1/dashboard/${symbol}/profile` (❌ Not implemented) 
- **AI News Analysis**: Calls `/api/v1/dashboard/${symbol}/news-analysis` (❌ Not implemented)

**Current Backend**: Only provides generic dashboard data at `/api/v1/dashboard/${symbol}`

### 2. Search Functionality Issues

**Problem**: Search implementation is limited and doesn't provide real-time stock discovery.

**Current State**:
- ✅ Frontend search UI implemented
- ✅ Backend search endpoint exists (`/api/v1/stocks/search`)
- ❌ Limited to hardcoded stock list (only 10 symbols)
- ❌ No real-time stock symbol lookup from external APIs

### 3. Data Integration Problems

**Problem**: Frontend components display loading states or errors because data doesn't flow properly.

**Issues**:
- Dashboard service provides nested data but components expect flat structure
- Missing data transformation layers
- No proper error boundaries for failed API calls
- Inconsistent data formats between frontend and backend

## Improvement Requirements

### Phase 1: Critical API Endpoint Implementation (Priority: High)

#### 1.1 Backend: Individual Component Endpoints

**Requirements**:
- Implement missing dashboard sub-endpoints
- Ensure proper data structure matching frontend expectations
- Add comprehensive error handling

**New Endpoints to Implement**:

```typescript
// 1. AI Investment Opinion Endpoint
GET /api/v1/dashboard/{symbol}/ai-analysis
Response: {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  analysisDate: string;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  timeHorizon: string;
  investmentRating: number; // 1-10
}

// 2. Stock Profile Endpoint
GET /api/v1/dashboard/{symbol}/profile
Response: {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  description: string;
  employees: number;
  founded: string;
  headquarters: string;
  website: string;
}

// 3. News Analysis Endpoint
GET /api/v1/dashboard/{symbol}/news-analysis
Response: {
  symbol: string;
  news: NewsItem[];
  analytics: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    totalArticles: number;
    highImpactNews: number;
    trendingTopics: string[];
    lastUpdated: string;
  };
}
```

#### 1.2 Backend: Enhanced Dashboard Controller

**File**: `apps/backend/src/dashboard/dashboard.controller.ts`

**New Methods**:
- `getAIAnalysis(symbol: string)`
- `getStockProfile(symbol: string)` 
- `getNewsAnalysis(symbol: string)`

#### 1.3 Backend: Data Service Refactoring

**File**: `apps/backend/src/dashboard/dashboard.service.ts`

**Changes**:
- Extract individual data service methods
- Add proper data transformation for each component
- Implement caching for expensive operations
- Add fallback data for service failures

### Phase 2: Search Enhancement (Priority: High)

#### 2.1 Enhanced Stock Search Service

**Requirements**:
- Integrate with external API for real-time stock discovery (Alpha Vantage symbol search)
- Expand supported symbols beyond hardcoded list
- Add fuzzy search capabilities
- Implement search result caching

**Implementation**:

```typescript
// New search service methods
async searchStocksExternal(query: string, limit: number = 10): Promise<SearchResult[]>;
async getSymbolInfo(symbol: string): Promise<SymbolInfo>;
async validateSymbol(symbol: string): Promise<boolean>;
```

#### 2.2 Frontend Search Enhancement

**File**: `apps/web/src/app/components/Header.tsx`

**Changes**:
- Add debounced search for better UX
- Implement search result highlighting
- Add "Add to Watchlist" functionality from search
- Display company names and sectors in search results

### Phase 3: Data Flow & Error Handling (Priority: Medium)

#### 3.1 Frontend Error Boundaries

**New Components**:
- `components/ErrorBoundary.tsx`
- `components/LoadingFallback.tsx`
- `components/DataErrorDisplay.tsx`

#### 3.2 Data Transformation Layer

**File**: `apps/web/src/lib/data-transformers.ts`

**Functions**:
```typescript
transformDashboardData(raw: DashboardResponse): ComponentData
transformAIAnalysis(raw: AIAnalysisResponse): AIAnalysisData
transformStockProfile(raw: StockProfileResponse): StockProfileData
transformNewsData(raw: NewsAnalysisResponse): NewsAnalysisData
```

#### 3.3 Enhanced SWR Configuration

**File**: `apps/web/src/app/components/SWRProvider.tsx`

**Improvements**:
- Add global error handling
- Implement retry strategies
- Add request deduplication
- Configure appropriate cache times

### Phase 4: UI/UX Improvements (Priority: Medium)

#### 4.1 Loading States Enhancement

**Requirements**:
- Replace basic skeleton loaders with branded animations
- Add progressive loading for different data sections
- Implement optimistic updates where appropriate

#### 4.2 Empty States & Error Messages

**Components**:
- Informative empty states with actionable messages
- Error recovery suggestions
- Connection status indicators

#### 4.3 Responsive Design Improvements

**Areas**:
- Better mobile layout for complex data tables
- Improved touch interactions
- Optimized loading for mobile networks

### Phase 5: Advanced Features (Priority: Low)

#### 5.1 User Preferences

**Features**:
- Customizable dashboard layout
- Favorite stocks persistence
- Notification preferences
- Theme selection

#### 5.2 Real-time Updates

**Implementation**:
- WebSocket connection for live price updates
- Background data refresh
- Push notifications for price alerts

#### 5.3 Advanced Analytics

**Features**:
- Historical performance tracking
- Portfolio simulation
- Advanced charting tools
- Export capabilities

## Technical Implementation Details

### Backend Implementation

#### 1. Dashboard Controller Extension

```typescript
// apps/backend/src/dashboard/dashboard.controller.ts

@Get(':symbol/ai-analysis')
async getAIAnalysis(@Param('symbol') symbol: string) {
  const analysis = await this.dashboardService.getAIAnalysis(symbol);
  return {
    success: true,
    data: analysis,
    timestamp: new Date().toISOString()
  };
}

@Get(':symbol/profile')
async getStockProfile(@Param('symbol') symbol: string) {
  const profile = await this.dashboardService.getStockProfile(symbol);
  return {
    success: true,
    data: profile,
    timestamp: new Date().toISOString()
  };
}

@Get(':symbol/news-analysis')
async getNewsAnalysis(@Param('symbol') symbol: string) {
  const newsAnalysis = await this.dashboardService.getNewsAnalysis(symbol);
  return {
    success: true,
    data: newsAnalysis,
    timestamp: new Date().toISOString()
  };
}
```

#### 2. Data Service Methods

```typescript
// apps/backend/src/dashboard/dashboard.service.ts

async getAIAnalysis(symbol: string): Promise<AIAnalysisData> {
  const newsData = await this.getNewsData(symbol);
  const stockData = await this.stocksService.getStock(symbol);
  
  // Transform existing dashboard data to AI analysis format
  return {
    symbol,
    recommendation: newsData.overview?.recommendation || 'HOLD',
    confidence: newsData.overview?.confidence || 0,
    targetPrice: this.calculateTargetPrice(stockData),
    currentPrice: stockData?.price?.current || 0,
    // ... additional transformation logic
  };
}

async getStockProfile(symbol: string): Promise<StockProfileData> {
  const stockData = await this.stocksService.getStock(symbol);
  
  return {
    symbol,
    companyName: stockData?.name || symbol,
    sector: stockData?.sectorPerformance?.name || 'Technology',
    marketCap: stockData?.fundamentals?.marketCap || 0,
    // ... additional company data
  };
}

async getNewsAnalysis(symbol: string): Promise<NewsAnalysisData> {
  const newsData = await this.getNewsData(symbol);
  
  return {
    symbol,
    news: this.transformNewsToItems(newsData),
    analytics: {
      overallSentiment: this.determineSentiment(newsData.stockNews?.headline),
      sentimentScore: this.calculateSentimentScore(newsData),
      // ... additional analytics
    }
  };
}
```

### Frontend Error Handling

```typescript
// apps/web/src/app/components/ErrorBoundary.tsx

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="error-boundary">
          <h3>Something went wrong</h3>
          <p>{error.message}</p>
          <button onClick={resetErrorBoundary}>Try Again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Success Metrics

### Phase 1 Success Criteria
- ✅ All frontend components display data without errors
- ✅ API endpoints return properly structured data
- ✅ Loading states transition to content within 2 seconds
- ✅ Error states provide helpful recovery options

### Phase 2 Success Criteria
- ✅ Search returns results for any valid stock symbol
- ✅ Search response time under 500ms
- ✅ Support for 1000+ stock symbols
- ✅ Search autocomplete functionality working

### User Experience Metrics
- **Load Time**: Dashboard loads completely within 3 seconds
- **Error Rate**: Less than 1% of API calls result in unhandled errors
- **Search Success**: 95% of searches return relevant results
- **Mobile Usability**: All features accessible on mobile devices

## Timeline Estimation

### Phase 1 (Critical): 1-2 weeks
- Backend endpoint implementation: 3-4 days
- Data transformation layer: 2-3 days
- Frontend integration testing: 2-3 days

### Phase 2 (Search): 1 week
- Enhanced search backend: 3-4 days
- Frontend search improvements: 2-3 days

### Phase 3 (Polish): 1 week
- Error handling: 3 days
- Loading states: 2 days
- Testing and QA: 2 days

**Total Estimated Time: 3-4 weeks**

## Risk Assessment

### High Risk
- **API Rate Limits**: External APIs may have usage limits
- **Data Inconsistency**: Multiple data sources may conflict
- **Performance**: Real-time features may impact server performance

### Medium Risk
- **Caching Strategy**: Complex caching may introduce stale data issues
- **Mobile Performance**: Heavy data loads on mobile networks

### Mitigation Strategies
- Implement comprehensive fallback systems
- Add monitoring and alerting for API failures
- Use progressive enhancement for advanced features
- Extensive testing across different network conditions

## Conclusion

This PRD addresses the critical gaps in the current Investie platform implementation. By focusing on the API endpoint mismatch, search functionality, and data flow issues, we can transform the platform from a partially functional prototype into a robust investment analysis tool.

The phased approach ensures that critical user-facing issues are resolved first, while allowing for incremental improvements that enhance the overall user experience.

Priority should be given to Phase 1 (Critical API Implementation) as this will immediately resolve the empty component states visible in the current application.