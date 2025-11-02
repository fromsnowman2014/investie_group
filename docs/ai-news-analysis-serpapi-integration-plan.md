# AI News Analysis - SERPAPI Integration & AI Summarization Plan

**Date:** 2025-11-02
**Objective:** Replace mock news data with real SERPAPI data and implement AI-powered 7-day news summarization

---

## 📋 Executive Summary

Transform the AI News Analysis component from displaying mock individual news articles to fetching real news via SERPAPI and generating concise AI-powered summaries using Claude AI. The key change is to **aggregate 7 days of news into a brief, actionable summary** (10 bullet points or less) rather than showing individual articles.

---

## 🎯 Core Requirements

### Current State (Mock Data)
- ❌ Displays 3 hardcoded mock news items per stock
- ❌ Shows individual article details (title, summary, sentiment)
- ❌ Static data with no real-time updates
- ❌ Limited to AAPL and TSLA with generic fallbacks

### Target State (SERPAPI + AI)
- ✅ Fetch real news from SERPAPI (7 days historical)
- ✅ Aggregate all news articles into a single AI-generated summary
- ✅ Display concise bullet-point summary (max 10 points)
- ✅ Include overall sentiment analysis
- ✅ Show trending topics from the aggregated news
- ✅ Cache results for 30 minutes
- ✅ Support any US-listed stock symbol

---

## 🏗️ Architecture Design

### Data Flow
```
User selects stock (e.g., AAPL)
    ↓
Frontend component requests news summary
    ↓
Backend API route checks cache
    ↓ (cache miss)
SERPAPI fetches 7-day news for symbol
    ↓
Claude AI analyzes and summarizes all articles
    ↓
Return consolidated summary with:
    - Overall sentiment (positive/negative/neutral)
    - 7-10 key bullet points
    - Trending topics
    - Market impact assessment
    ↓
Cache result for 30 minutes
    ↓
Display in simplified UI component
```

### API Integration Points

#### 1. **SERPAPI Integration**
- **Endpoint:** `https://serpapi.com/search`
- **Parameters:**
  - `q`: `{symbol} stock news` (e.g., "AAPL stock news")
  - `tbm`: `nws` (news search)
  - `tbs`: `qdr:w` (past week)
  - `num`: `20` (fetch 20 articles for better context)
  - `api_key`: `SERPAPI_API_KEY` (from env)

#### 2. **Claude AI Summarization**
- **Model:** `claude-sonnet-4-5-20250929` (already configured)
- **Prompt Strategy:**
  - System: "You are a financial news analyst. Summarize stock news concisely."
  - User: "Analyze these {count} news articles for {symbol} from the past 7 days and provide: 1) Overall sentiment, 2) 7-10 key bullet points, 3) Top 3 trending topics, 4) Market impact assessment. Be concise and actionable."
  - Input: JSON array of news articles from SERPAPI
  - Output: Structured JSON response

---

## 📊 Data Structures

### SERPAPI Response (Simplified)
```typescript
interface SerpApiNewsResult {
  news_results: Array<{
    title: string;
    link: string;
    snippet: string;
    source: string;
    date: string; // e.g., "2 days ago"
    thumbnail?: string;
  }>;
}
```

### New API Response Format
```typescript
interface NewsAnalysisSummary {
  symbol: string;
  summary: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number; // 0-100
    keyPoints: string[]; // 7-10 concise bullet points
    trendingTopics: string[]; // Top 3-5 topics
    marketImpact: string; // Single sentence impact assessment
  };
  metadata: {
    articlesAnalyzed: number;
    timeRange: string; // "Past 7 days"
    lastUpdated: string; // ISO timestamp
  };
}
```

### Frontend Component Props (Simplified)
```typescript
interface AINewsSummaryProps {
  symbol: string;
}
```

---

## 🛠️ Implementation Steps (TDD Approach)

### Phase 1: Backend Infrastructure Setup
**Goal:** Set up SERPAPI client and environment configuration

#### Step 1.1: Environment Configuration
- [ ] Add `SERPAPI_API_KEY` to `.env.local`
- [ ] Add `SERPAPI_API_KEY` to Vercel environment variables
- [ ] Update type definitions for environment variables

**Test:** Verify environment variable is accessible in API route

#### Step 1.2: SERPAPI Client Utility
**File:** `apps/web/src/lib/serpapi-client.ts`

**Implementation:**
```typescript
export interface SerpApiNewsArticle {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
}

export async function fetchNewsFromSerpApi(
  symbol: string,
  days: number = 7
): Promise<SerpApiNewsArticle[]>
```

**Tests:**
- ✅ Should fetch news for valid symbol
- ✅ Should handle API key missing
- ✅ Should handle API rate limits (429)
- ✅ Should handle network errors
- ✅ Should parse SERPAPI response correctly
- ✅ Should filter news from past 7 days

---

### Phase 2: AI Summarization Service
**Goal:** Create Claude AI service to summarize news articles

#### Step 2.1: Claude AI Summarizer
**File:** `apps/web/src/lib/claude-news-summarizer.ts`

**Implementation:**
```typescript
export interface NewsSummary {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  keyPoints: string[];
  trendingTopics: string[];
  marketImpact: string;
}

export async function summarizeNewsWithClaude(
  symbol: string,
  articles: SerpApiNewsArticle[]
): Promise<NewsSummary>
```

**Tests:**
- ✅ Should generate summary from valid articles
- ✅ Should determine correct sentiment
- ✅ Should extract 7-10 key points
- ✅ Should identify trending topics
- ✅ Should handle empty article list
- ✅ Should handle Claude API errors
- ✅ Should validate response structure

---

### Phase 3: API Route Refactoring
**Goal:** Update API route to use SERPAPI + Claude instead of mock data

#### Step 3.1: Update News Analysis Route
**File:** `apps/web/src/app/api/v1/dashboard/[symbol]/news-analysis/route.ts`

**Key Changes:**
1. Remove `getMockNewsData()` function
2. Replace `fetchNewsAnalysis()` with real implementation:
   - Fetch news from SERPAPI
   - Summarize with Claude AI
   - Return new summary format
3. Keep caching logic intact (30 min cache)
4. Add error handling with fallback

**Tests:**
- ✅ Should return cached result when available
- ✅ Should fetch fresh data when cache expires
- ✅ Should handle SERPAPI failures gracefully
- ✅ Should handle Claude AI failures gracefully
- ✅ Should validate symbol parameter
- ✅ Should return 400 for invalid symbols
- ✅ Should cache successful responses
- ✅ Should handle concurrent requests efficiently

---

### Phase 4: Frontend Component Refactoring
**Goal:** Simplify component to display AI-generated summary instead of individual articles

#### Step 4.1: Update AINewsAnalysisReport Component
**File:** `apps/web/src/app/components/MarketIntelligence/AINewsAnalysisReport.tsx`

**Key Changes:**
1. Remove individual news item rendering
2. Add summary display:
   - Overall sentiment badge
   - Bullet-point key points list
   - Trending topics chips
   - Market impact statement
   - Metadata (articles analyzed, time range)
3. Simplify loading/error states
4. Update SWR hook to new response type

**UI Mockup:**
```
┌─────────────────────────────────────────────┐
│  📊 AI News Analysis - AAPL                 │
│                                             │
│  Overall Sentiment: 🟢 POSITIVE (Score: 78) │
│  Analyzed: 18 articles from past 7 days     │
│                                             │
│  Key Insights:                              │
│  • Strong iPhone 15 sales exceed analyst... │
│  • Services revenue grows 15% YoY driven... │
│  • Vision Pro production ramping up for...  │
│  • Margin expansion in App Store business...│
│  • Analyst upgrades from Morgan Stanley...  │
│  • New AI features announced at WWDC...     │
│  • Supply chain diversification progress... │
│                                             │
│  🔥 Trending Topics:                        │
│  [iPhone 15] [Services] [AI Features] [AR] │
│                                             │
│  Market Impact: Positive momentum expected  │
│  driven by strong product cycle and         │
│  services growth.                           │
│                                             │
│  Last updated: 2025-11-02 14:30             │
└─────────────────────────────────────────────┘
```

**Tests (Component Testing):**
- ✅ Should render summary correctly
- ✅ Should display sentiment badge with correct color
- ✅ Should render bullet points (max 10)
- ✅ Should display trending topics
- ✅ Should show market impact
- ✅ Should handle loading state
- ✅ Should handle error state
- ✅ Should refresh on trigger

---

### Phase 5: CSS Styling Updates
**Goal:** Update styles for simplified summary layout

#### Step 5.1: Update Component Styles
**File:** `apps/web/src/app/globals.css` (or component-specific CSS)

**Key Changes:**
- Remove individual news card styles
- Add summary container styles
- Style bullet-point list for readability
- Ensure mobile responsiveness
- Add subtle animations for loading state

---

## 🧪 Testing Strategy (TDD)

### Unit Tests

#### Backend Tests
1. **SERPAPI Client Tests** (`serpapi-client.test.ts`)
   - Mock SERPAPI HTTP calls
   - Test response parsing
   - Test error handling
   - Test date filtering

2. **Claude Summarizer Tests** (`claude-news-summarizer.test.ts`)
   - Mock Claude API calls
   - Test prompt construction
   - Test response parsing
   - Test sentiment scoring
   - Test topic extraction

3. **API Route Tests** (`route.test.ts`)
   - Mock SERPAPI and Claude services
   - Test caching logic
   - Test error fallbacks
   - Test symbol validation

#### Frontend Tests
4. **Component Tests** (`AINewsAnalysisReport.test.tsx`)
   - Mock SWR data fetching
   - Test rendering with data
   - Test loading state
   - Test error state
   - Test refresh trigger

### Integration Tests
- End-to-end test: Select stock → Fetch news → Display summary
- Test with real SERPAPI key (in CI/CD)
- Test cache expiration behavior

### Manual Testing Checklist
- [ ] Test with popular stocks (AAPL, TSLA, GOOGL)
- [ ] Test with less popular stocks
- [ ] Test with invalid symbols
- [ ] Test cache behavior (refresh after 30 min)
- [ ] Test error states (API key missing, rate limits)
- [ ] Test mobile responsiveness
- [ ] Test loading states
- [ ] Verify sentiment accuracy
- [ ] Verify summary quality (concise, actionable)

---

## 🔐 Security & Rate Limiting

### Environment Variables
- Store `SERPAPI_API_KEY` securely in Vercel
- Never expose API keys in client-side code
- Use server-side API routes only

### Rate Limiting
- **SERPAPI Free Tier:** 100 searches/month
- **Strategy:**
  - Cache results for 30 minutes
  - Implement request throttling (max 1 req/symbol/30min)
  - Monitor usage with logging

### Error Handling
- Graceful degradation if SERPAPI unavailable
- Fallback message: "News summary unavailable. Please try again later."
- Log errors for monitoring (without exposing sensitive data)

---

## 📈 Performance Optimization

### Caching Strategy
- **In-memory cache:** 30 minutes per symbol
- **Cache key:** Symbol + date (to auto-invalidate daily)
- **Max cache size:** 100 symbols (LRU eviction)

### API Call Optimization
- Fetch news once per symbol per 30 min
- Parallel processing: SERPAPI fetch + Claude summarization (if needed)
- Timeout limits: 10s for SERPAPI, 20s for Claude

### Frontend Optimization
- SWR caching (10 min client-side)
- Prefetch news for popular stocks
- Lazy load component

---

## 🚀 Deployment Plan

### Step 1: Development
1. Implement backend services (SERPAPI + Claude)
2. Write and pass all unit tests
3. Update API route
4. Test locally with real API keys

### Step 2: Frontend Integration
1. Refactor component
2. Update styles
3. Test with new API response
4. Write component tests

### Step 3: Staging
1. Deploy to Vercel preview
2. Add `SERPAPI_API_KEY` to Vercel environment
3. Run integration tests
4. Manual QA testing

### Step 4: Production
1. Merge to main branch
2. Monitor error rates
3. Monitor SERPAPI usage
4. Collect user feedback

---

## 📝 Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper error types
- Full interface definitions

### Testing
- Minimum 80% code coverage
- All edge cases covered
- Integration tests for critical paths

### Documentation
- JSDoc comments for all public functions
- README updates
- API documentation

---

## 🎯 Success Metrics

### Functional
- ✅ Real news data fetched successfully
- ✅ AI summaries generated accurately
- ✅ Cache hit rate > 50%
- ✅ API error rate < 5%

### User Experience
- ✅ Summary is concise (< 10 bullet points)
- ✅ Sentiment accuracy validated manually
- ✅ Loading time < 3 seconds
- ✅ Mobile-friendly display

### Technical
- ✅ All tests passing
- ✅ No production errors
- ✅ SERPAPI usage within limits
- ✅ Claude API usage optimized

---

## 🔄 Rollback Plan

If issues arise in production:
1. Revert to mock data temporarily
2. Keep API route backward compatible
3. Feature flag to toggle SERPAPI integration
4. Monitor error logs for root cause

---

## 📚 References

- [SERPAPI News Search Documentation](https://serpapi.com/news-results)
- [Claude AI API Documentation](https://docs.anthropic.com/claude/reference)
- [SWR Documentation](https://swr.vercel.app/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🗓️ Timeline Estimate

- **Phase 1 (Backend Setup):** 2-3 hours
- **Phase 2 (AI Summarization):** 3-4 hours
- **Phase 3 (API Route Refactoring):** 2-3 hours
- **Phase 4 (Frontend Refactoring):** 3-4 hours
- **Phase 5 (Styling):** 1-2 hours
- **Testing & QA:** 3-4 hours
- **Deployment & Monitoring:** 1-2 hours

**Total Estimated Time:** 15-22 hours

---

## ✅ Acceptance Criteria

- [ ] SERPAPI integration working with real API key
- [ ] Claude AI generates accurate summaries
- [ ] Frontend displays summary (not individual articles)
- [ ] All tests passing (unit + integration)
- [ ] Cache working correctly (30 min expiration)
- [ ] Error handling tested and working
- [ ] Mobile responsive design
- [ ] Production deployment successful
- [ ] No API rate limit violations
- [ ] User feedback positive

---

**Next Steps:** Begin implementation with Phase 1 - Backend Infrastructure Setup, following TDD approach.