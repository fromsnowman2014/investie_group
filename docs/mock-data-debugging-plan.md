# Mock Data 사용 문제 디버깅 플랜

## 🚨 현재 상황

**문제**: 모든 컴포넌트(macro indicators 포함)가 mock data를 반환하고 있음  
**근본 원인**: Supabase Edge Functions Secrets에 API 키가 설정되지 않음  
**아키텍처**: Frontend (Vercel) → Supabase Edge Functions → 외부 APIs

## 🔍 발견된 주요 문제점

### 1. Supabase Edge Functions Secrets 누락 ❌
Edge Functions에서 `Deno.env.get()`로 조회하는 환경변수들:
```bash
ALPHA_VANTAGE_API_KEY    # market-overview, data-collector
FRED_API_KEY            # market-overview (경제 지표)
SERPAPI_API_KEY         # news-analysis  
CLAUDE_API_KEY          # news-analysis, ai-analysis, data-collector
OPENAI_API_KEY          # ai-analysis (fallback)
SERVICE_ROLE_KEY        # data-collector
```

### 2. Vercel 환경변수 상태 ✅
- ✅ `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` 설정됨
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨

### 3. Edge Functions 동작 로직
```typescript
// market-overview/index.ts:334-344
if (!alphaVantageApiKey) {
  console.warn('Alpha Vantage API key not configured, using mock data');
  return getMockMarketOverview(); // ← 여기서 Mock 데이터 반환!
}
```

## 📋 단계별 디버깅 플랜

### Phase 1: Supabase Edge Functions Secrets 설정 (High Priority)

#### 1.1 Supabase 대시보드에서 Edge Functions Secrets 설정
**위치**: https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/settings/edge-functions

**설정할 Secrets**:
```bash
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key    # 주식/지수 데이터
FRED_API_KEY=your-fred-key                      # 경제 지표 데이터
SERPAPI_API_KEY=your-serpapi-key                # Google 뉴스 데이터  
CLAUDE_API_KEY=sk-ant-your-claude-key           # AI 분석
OPENAI_API_KEY=sk-your-openai-key              # AI 분석 fallback
SERVICE_ROLE_KEY=your-supabase-service-key     # Supabase 서비스 키
```

#### 1.2 Edge Functions 배포 상태 확인
```bash
# 1. Supabase 로그인 확인
supabase login

# 2. 프로젝트 연결 확인
supabase link --project-ref fwnmnjwtbggasmunsfyk

# 3. Functions 배포 상태 확인  
supabase functions list

# 4. 필요시 재배포
supabase functions deploy
```

#### 1.3 Edge Functions 테스트
```bash
# 각 Function 개별 테스트
curl -X POST https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json"
```

### Phase 2: Frontend 연결 및 Vercel 환경변수 검증 (Medium Priority)

#### 2.1 Vercel 환경변수 확인
**위치**: https://vercel.com/dashboard/your-project/settings/environment-variables

**현재 설정 상태 확인**:
```bash
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1  ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ✅
```

#### 2.2 브라우저에서 API 호출 테스트
```javascript
// 브라우저 개발자 도구에서 실행
fetch('https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('Market Overview Response:', data);
  console.log('Data Source:', data.source); // 'mock_data'인지 'alpha_vantage'인지 확인
});
```

#### 2.3 각 컴포넌트별 실시간 테스트
1. **MacroIndicators**: 브라우저 콘솔에서 `source` 필드 확인
2. **AIAnalysis**: Claude API 응답 vs Mock 응답 구분
3. **MarketIntelligence**: SerpAPI 뉴스 vs Mock 뉴스 구분
4. **Stock Data**: Alpha Vantage vs Mock 주가 데이터 구분

### Phase 3: 로깅 및 모니터링 강화 (Low Priority)

#### 3.1 Edge Functions 로그 모니터링
```bash
# Supabase 대시보드에서 Edge Functions 로그 확인
# 위치: https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/logs/edge-functions

# 또는 CLI로 로그 조회
supabase functions logs market-overview
supabase functions logs news-analysis
```

#### 3.2 API 키 유효성 검증 로직 추가
```typescript
// Edge Functions에 API 키 검증 로직 추가
const testApiKey = async (apiKey: string, service: string) => {
  // 실제 API 호출 테스트 후 결과 로깅
}
```

#### 3.3 Frontend Error Boundary 개선
- API 키 누락 시 사용자에게 명확한 메시지 표시
- Mock 데이터 사용 시 UI에서 경고 표시
- Real-time 데이터 vs Mock 데이터 구분

## 🔧 체크리스트

### ✅ 즉시 확인 사항 (Phase 1)
- [ ] **Supabase Edge Functions Secrets** 6개 API 키 모두 설정
- [ ] Edge Functions 배포 상태 확인 (`supabase functions list`)
- [ ] 각 Function별 개별 테스트 성공

### ✅ 연결 검증 (Phase 2)  
- [ ] Vercel 환경변수 2개 정상 설정 확인
- [ ] 브라우저에서 직접 Edge Function 호출 테스트
- [ ] 각 컴포넌트에서 `source` 필드가 `mock_data`가 아닌 실제 API 이름으로 변경됨

### ✅ 최종 검증
- [ ] MacroIndicators: `source: 'alpha_vantage'` 표시
- [ ] AIAnalysis: `source: 'claude_api'` 또는 `openai_api` 표시
- [ ] MarketIntelligence: `source: 'serp_api'` 표시  
- [ ] 브라우저 콘솔에 "using mock data" 경고 메시지 사라짐

## 🚨 Critical Actions - 올바른 순서

1. **1순위**: Supabase 대시보드 → Edge Functions → Secrets 설정
2. **2순위**: Vercel 대시보드 → Environment Variables 확인
3. **3순위**: 브라우저 개발자도구에서 실시간 테스트

## 📊 예상 해결 시간

- **Phase 1**: 15분 (Supabase Secrets 설정)
- **Phase 2**: 30분 (Vercel 확인 + 테스트)  
- **Phase 3**: 1시간 (모니터링 + 최적화)

**총 예상 시간**: 1.5시간 (이전 3.5시간에서 단축)

---

## 🔑 핵심 깨달음

**잘못된 접근**: `apps/backend/.env` 파일 수정 (더 이상 사용되지 않음)  
**올바른 접근**: **Supabase Edge Functions Secrets** 설정

**아키텍처 이해**:
```
Frontend (Vercel) 
    ↓ NEXT_PUBLIC_SUPABASE_* 환경변수
Supabase Edge Functions 
    ↓ Deno.env.get() → Supabase Secrets
External APIs (Claude, SerpAPI, Alpha Vantage)
```

*작성일: 2025-09-12*  
*목적: Railway → Supabase 마이그레이션 후 올바른 mock data 문제 해결*