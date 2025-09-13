# Real-Time Data Implementation Action Plan

## Current Status Analysis (2025-09-11)

### 🔍 **Issue Identification**

Based on console logs and application analysis, the following issues are preventing real-time data display:

1. **Backend Infrastructure Migration Required**
   - Railway free tier has ended - service discontinued
   - Production backend (Railway) no longer accessible: 404 "Application not found"
   - Local backend (localhost:3001) returns "Internal Server Error"
   - **CRITICAL**: Need to migrate from Railway to Supabase Edge Functions

2. **Data Freshness Issues**
   - Frontend showing potentially cached/fallback data
   - SWR cache may be serving stale data due to backend infrastructure failure
   - Migration to serverless architecture required for cost-effective operation

## 📊 **Current Data Architecture Assessment**

### ✅ **Working Components**
- TradingView chart widgets (real-time market data)
- Frontend UI and navigation
- Local caching and fallback mechanisms
- SWR data fetching configuration

### ❌ **Broken Components**
- Backend API endpoints (/api/v1/) - Railway infrastructure down
- Real-time stock data fetching - requires backend migration
- AI analysis and news data - needs Supabase Edge Functions
- Market overview and macro indicators - backend dependency

### 🔄 **Infrastructure Migration Required**
- Application currently using mock/cached data due to Railway shutdown
- Backend services need migration to Supabase Edge Functions
- Database already on Supabase - partial migration completed
- API endpoints need serverless function conversion

## 🎯 **Action Items for Real-Time Data Implementation**

### **Phase 1: Edge Functions Implementation (High Priority)**
**전제조건**: Supabase CLI 설치 및 Edge Functions 생성 완료

#### 1.1 **Stock Data Edge Function 구현**
```typescript
// supabase/functions/stock-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { symbol } = await req.json()
  
  // Alpha Vantage API 호출 로직 구현
  const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')
  // Yahoo Finance 백업 로직 구현
  
  return new Response(JSON.stringify(stockData), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**구현 작업:**
- [ ] Alpha Vantage API 호출 로직 NestJS에서 Deno로 변환
- [ ] Yahoo Finance 백업 데이터 소스 구현
- [ ] 데이터 캐싱 로직 Supabase DB 연동
- [ ] 에러 처리 및 fallback 메커니즘 구현

#### 1.2 **AI Analysis Edge Function 구현**
```typescript
// supabase/functions/ai-analysis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { symbol } = await req.json()
  
  // Claude API 호출 로직
  const claudeKey = Deno.env.get('CLAUDE_API_KEY')
  // OpenAI 백업 로직
  
  return new Response(JSON.stringify(aiAnalysis), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**구현 작업:**
- [ ] Claude API 호출 로직 변환
- [ ] OpenAI 백업 API 구현
- [ ] 투자 추천 알고리즘 이식
- [ ] 신뢰도 스코어링 시스템 구현

#### 1.3 **News Analysis Edge Function 구현**
```typescript
// supabase/functions/news-analysis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { symbol } = await req.json()
  
  // SerpAPI 뉴스 수집
  const serpApiKey = Deno.env.get('SERPAPI_API_KEY')
  // Claude AI 뉴스 분석
  const claudeKey = Deno.env.get('CLAUDE_API_KEY')
  
  return new Response(JSON.stringify(newsAnalysis), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**구현 작업:**
- [ ] SerpAPI 뉴스 수집 로직 변환
- [ ] AI 뉴스 분석 파이프라인 구현
- [ ] 감정 분석 알고리즘 이식
- [ ] 뉴스 캐싱 및 중복 제거 로직

#### 1.4 **Market Overview Edge Function 구현**
```typescript
// supabase/functions/market-overview/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // FRED API 매크로 지표 수집
  const fredApiKey = Deno.env.get('FRED_API_KEY')
  // 시장 지수 데이터 통합
  
  return new Response(JSON.stringify(marketData), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**구현 작업:**
- [ ] FRED API 매크로 지표 수집 로직
- [ ] 시장 지수 데이터 통합 구현
- [ ] Fear & Greed Index 계산 로직
- [ ] 시장 시간대별 데이터 처리

### **Phase 2: Frontend Integration (High Priority)**
**전제조건**: Edge Functions 기본 구현 완료

#### 2.1 **Frontend API URL 업데이트**
```typescript
// apps/web/src/lib/api-utils.ts 업데이트
const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Railway URL 완전 제거 및 Supabase Edge Functions로 대체
const edgeFunctionFetcher = async (functionName: string, payload: any) => {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  return response.json()
}
```

**구현 작업:**
- [ ] 모든 Railway API 호출을 Supabase Edge Functions로 변경
- [ ] SWR fetcher 함수들 업데이트
- [ ] 환경변수 설정 (.env.local) 업데이트
- [ ] 에러 처리 및 fallback 로직 구현

#### 2.2 **컴포넌트별 API 호출 업데이트**
```typescript
// AIInvestmentOpinion.tsx
const { data, error, isLoading } = useSWR(
  symbol ? `ai-analysis-${symbol}` : null,
  () => edgeFunctionFetcher('ai-analysis', { symbol }),
  { refreshInterval: 600000 }
);

// AINewsAnalysisReport.tsx  
const { data, error, isLoading } = useSWR(
  symbol ? `news-analysis-${symbol}` : null,
  () => edgeFunctionFetcher('news-analysis', { symbol }),
  { refreshInterval: 600000 }
);

// StockProfile.tsx
const { data, error, isLoading } = useSWR(
  symbol ? `stock-data-${symbol}` : null,
  () => edgeFunctionFetcher('stock-data', { symbol }),
  { refreshInterval: 300000 }
);
```

**구현 작업:**
- [ ] AIInvestmentOpinion 컴포넌트 API 호출 변경
- [ ] AINewsAnalysisReport 컴포넌트 API 호출 변경
- [ ] StockProfile 컴포넌트 API 호출 변경
- [ ] MacroIndicatorsDashboard 컴포넌트 API 호출 변경

### **Phase 3: Testing & Optimization (Medium Priority)**

#### 3.1 **Edge Functions 테스트 및 디버깅**
```bash
# 로컬 테스트
supabase functions serve
curl -X POST "http://localhost:54321/functions/v1/stock-data" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'

# 프로덕션 테스트
curl -X POST "https://your-project-id.supabase.co/functions/v1/stock-data" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

**테스트 작업:**
- [ ] 각 Edge Function 개별 테스트 
- [ ] 프론트엔드 통합 테스트
- [ ] 에러 처리 시나리오 테스트
- [ ] 성능 및 응답 시간 측정

#### 3.2 **Performance Optimization**
```typescript
// Edge Function 캐싱 구현
const CACHE_TTL = 5 * 60 * 1000; // 5분
const cache = new Map();

// Supabase DB 캐싱 활용
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
```

**최적화 작업:**
- [ ] 메모리 캐싱 구현
- [ ] Supabase DB 캐싱 활용
- [ ] API 호출 빈도 최적화
- [ ] Cold start 시간 단축

### **Phase 4: Production Deployment & Monitoring (Medium Priority)**

#### 4.1 **Edge Functions 프로덕션 배포**
```bash
# 개별 함수 배포
supabase functions deploy stock-data
supabase functions deploy ai-analysis
supabase functions deploy news-analysis
supabase functions deploy market-overview

# 배포 상태 확인
supabase functions list
```

**배포 작업:**
- [ ] 모든 Edge Functions 프로덕션 배포
- [ ] 환경변수 프로덕션 설정 확인
- [ ] CORS 및 인증 설정 검증
- [ ] 배포 후 기능 테스트

#### 4.2 **실시간 모니터링 설정**
```typescript
// APIDebugger.tsx 업데이트
const [edgeFunctionsStatus, setEdgeFunctionsStatus] = useState({
  stockData: 'unknown',
  aiAnalysis: 'unknown',
  newsAnalysis: 'unknown',
  marketOverview: 'unknown'
})

// Edge Functions health check
const checkEdgeFunctionsHealth = async () => {
  const functions = ['stock-data', 'ai-analysis', 'news-analysis', 'market-overview']
  // 각 함수별 상태 체크 로직
}
```

**모니터링 작업:**
- [ ] APIDebugger 컴포넌트 Edge Functions용 업데이트
- [ ] 각 함수별 health check 구현
- [ ] 에러 로깅 및 알림 시스템
- [ ] Supabase 대시보드 모니터링 설정

## 🚀 **Implementation Timeline**

### **Week 1: Edge Functions 구현 (Phase 1)**
- Day 1-2: Stock Data Edge Function 구현 및 테스트
- Day 3-4: AI Analysis Edge Function 구현 및 테스트  
- Day 5-6: News Analysis Edge Function 구현 및 테스트
- Day 7: Market Overview Edge Function 구현 및 테스트

### **Week 2: Frontend 통합 (Phase 2)**
- Day 1-2: 프론트엔드 API URL 업데이트 및 새로운 fetcher 구현
- Day 3-4: 각 컴포넌트별 API 호출 변경 및 테스트
- Day 5-6: 통합 테스트 및 에러 처리 구현
- Day 7: 사용자 경험 테스트 및 버그 수정

### **Week 3: 최적화 및 배포 (Phase 3-4)**
- Day 1-2: Edge Functions 성능 최적화 및 캐싱 구현
- Day 3-4: 프로덕션 배포 및 모니터링 설정
- Day 5-6: 실시간 데이터 검증 및 품질 확인
- Day 7: 최종 테스트 및 Railway 완전 제거

## 📈 **Expected Outcomes**

### **Immediate Benefits (Week 1)**
- Serverless backend infrastructure on Supabase
- Cost-effective Edge Functions replacing Railway
- Live stock prices and market data via Edge Functions

### **Enhanced Features (Week 2-3)**
- Real-time AI investment recommendations via serverless functions
- Current news analysis and sentiment processing
- Intelligent caching and optimized Edge Function performance

### **Performance Metrics**
- Data freshness: < 1 minute during market hours
- API response time: < 500ms average
- Error rate: < 1% for critical endpoints
- User experience: Real-time updates without lag

## 💰 **Cost Estimation**

### **Monthly Infrastructure Costs (Production)**
- **Supabase Pro Plan**: $25/month (includes database + Edge Functions)
- Alpha Vantage Premium: $25/month
- SerpAPI Standard: $50/month  
- Anthropic Claude: ~$50/month (estimated)
- **Total: ~$150/month (vs $125 + Railway costs previously)**

### **Cost Benefits of Supabase Migration**
- ✅ No Railway hosting costs (was becoming expensive)
- ✅ Serverless Edge Functions scale to zero (cost-efficient)
- ✅ Integrated database and backend in single platform
- ✅ Better performance with Edge locations globally

### **Development Time for Migration**
- Supabase Edge Functions setup: 4-8 hours
- Backend migration (NestJS → Edge Functions): 16-24 hours
- Frontend API URL updates: 4-6 hours
- Testing and deployment: 6-10 hours
- **Total: 30-48 hours**

## 🔧 **Immediate Next Steps** (Manual Setup 완료 후)

### **1단계: Stock Data Edge Function 구현** (최우선)
```typescript
// supabase/functions/stock-data/index.ts 작성
// Alpha Vantage + Yahoo Finance 로직 구현
// 에러 처리 및 캐싱 구현
```

### **2단계: AI Analysis Edge Function 구현**
```typescript  
// supabase/functions/ai-analysis/index.ts 작성
// Claude API + OpenAI 백업 로직 구현
// 투자 추천 알고리즘 이식
```

### **3단계: Frontend API 호출 변경**
```typescript
// apps/web/src/lib/api-utils.ts 업데이트
// edgeFunctionFetcher 구현
// 컴포넌트별 SWR 호출 변경
```

### **4단계: 테스트 및 배포**
```bash
# 로컬 테스트
supabase functions serve

# 프로덕션 배포
supabase functions deploy stock-data
```

### **5단계: Railway 완전 제거**
- [ ] 모든 Railway URL 참조 제거
- [ ] 환경변수에서 Railway 관련 설정 삭제
- [ ] 코드베이스에서 Railway 의존성 정리

---

**우선순위:** Stock Data → AI Analysis → News Analysis → Market Overview → Frontend 통합

**성공 기준:** Edge Functions를 통한 실시간 주식 데이터, AI 분석, 뉴스 분석이 프론트엔드에 정상 표시