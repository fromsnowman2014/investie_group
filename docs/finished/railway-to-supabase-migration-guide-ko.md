# Railway → Supabase 마이그레이션 가이드

## 📋 개요

Railway 무료 서비스 종료에 따라 Investie 앱의 백엔드 인프라를 Supabase Edge Functions로 완전 이전하는 단계별 가이드입니다.

## 🎯 마이그레이션 목표

### **이전 아키텍처 (Railway)**
```
프론트엔드 → Railway NestJS 서버 → 외부 API → 데이터베이스
```

### **새로운 아키텍처 (Supabase)**
```
프론트엔드 → Supabase Edge Functions → 외부 API → Supabase 데이터베이스
```

## 📦 준비사항

### **필요한 도구 및 계정**
- [ ] Supabase 계정 (기존 프로젝트 또는 새 프로젝트)
- [ ] Node.js 18+ 설치
- [ ] Supabase CLI 설치
- [ ] 기존 API 키들 (Alpha Vantage, Claude, SerpAPI, FRED)

### **기존 Railway 프로젝트에서 확인된 환경변수**
**마이그레이션 대상 API Keys:**
```bash
ALPHA_VANTAGE_API_KEY=xxxx
CLAUDE_API_KEY=xxxxx
FRED_API_KEY=xxxx
GEMINI_API_KEY=xxxx
SERPAPI_API_KEY=xxxxx


**마이그레이션 불필요 변수:**
- `NODE_ENV=production` (Edge Functions에서 자동 설정)
- `PORT=3000` (서버리스 환경에서 불필요)

## 🚀 1단계: Supabase 프로젝트 설정

### **1.1 Supabase CLI 설치**
```bash
# npm을 통한 전역 설치
npm install -g supabase

# 설치 확인
supabase --version
```

### **1.2 Supabase 로그인**
```bash
# Supabase에 로그인
supabase login

# 브라우저가 열리고 인증 완료 후 CLI에서 확인
```

### **1.3 프로젝트 초기화**
```bash
# 프로젝트 루트에서 실행
cd /path/to/investie_group

# Supabase 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start
```

### **1.4 기존 Supabase 프로젝트 연결 (이미 있는 경우)**
```bash
# 기존 프로젝트 ID로 연결
supabase link --project-ref fwnmnjwtbggasmunsfyk

# 프로젝트 상태 확인
supabase status
```

## 🔧 2단계: Edge Functions 생성

### **2.1 핵심 Edge Functions 생성**
```bash
# 주식 데이터 처리 함수
supabase functions new stock-data

# AI 분석 함수
supabase functions new ai-analysis

# 뉴스 분석 함수
supabase functions new news-analysis

# 시장 개요 함수
supabase functions new market-overview

# 생성된 함수 확인
ls supabase/functions/
```

### **2.2 Edge Functions 디렉토리 구조**
```
supabase/
├── functions/
│   ├── stock-data/
│   │   └── index.ts
│   ├── ai-analysis/
│   │   └── index.ts
│   ├── news-analysis/
│   │   └── index.ts
│   └── market-overview/
│       └── index.ts
└── config.toml
```

## 📝 3단계: NestJS 서비스를 Edge Functions로 변환

### **3.1 기존 NestJS 코드 분석**
변환이 필요한 주요 서비스들:

1. **Stock Data Service** (`apps/backend/src/stocks/`)
   - Alpha Vantage API 호출
   - Yahoo Finance 백업 데이터
   - 데이터 캐싱 로직

2. **AI Analysis Service** (`apps/backend/src/ai/`)
   - Claude API 호출
   - OpenAI 백업
   - 투자 추천 생성

3. **News Service** (`apps/backend/src/news/`)
   - SerpAPI 뉴스 수집
   - AI 뉴스 분석
   - 감정 분석

4. **Market Service** (`apps/backend/src/market/`)
   - 시장 지수 데이터
   - 매크로 지표 수집

### **3.2 변환 방법론**

#### **TypeScript/NestJS → Deno/Edge Functions**
```typescript
// 기존 NestJS 스타일
@Injectable()
export class StockDataService {
  async getStockData(symbol: string) {
    // 구현 로직
  }
}

// 새로운 Edge Function 스타일
export default async function handler(req: Request) {
  const { symbol } = await req.json();
  
  // 구현 로직 이전
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

#### **주요 변환 포인트**
- `@Injectable()` 데코레이터 제거
- `Request/Response` 객체로 HTTP 처리
- 환경변수는 `Deno.env.get()` 사용
- npm 패키지 대신 Deno 모듈 사용

## 🔑 4단계: 환경변수 설정

### **4.1 Supabase 대시보드에서 환경변수 설정**

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Edge Functions 환경변수 설정**
   - Settings → Edge Functions
   - Environment Variables 섹션

3. **Railway에서 이전할 환경변수 추가**
**Supabase Dashboard → Settings → Edge Functions → Environment Variables**

| Variable Name | Value | 사용 목적 |
|---------------|-------|----------|
| `ALPHA_VANTAGE_API_KEY` | `xxxx` | 주식 데이터 수집 |
| `CLAUDE_API_KEY` | `xxxx` | AI 투자 분석 |
| `FRED_API_KEY` | `xxxx` | 경제 지표 데이터 |
| `GEMINI_API_KEY` | `xxxx` | Google Gemini AI (백업용) |
| `GOOGLE_API_KEY` | `xxxx` | Google 서비스 |
| `SERPAPI_API_KEY` | `xxxx` | 뉴스 검색 |

**⚠️ 보안 주의사항:**
- API 키들을 하나씩 복사하여 정확히 입력
- 각 키의 앞뒤 공백 제거
- Supabase Dashboard에서만 키 값 확인 가능

### **4.2 로컬 개발용 환경변수**
```bash
# supabase/.env 파일 생성 (Railway 키 값 사용)
echo "ALPHA_VANTAGE_API_KEY=xxxxx" >> supabase/.env
echo "CLAUDE_API_KEY=xxxx" >> supabase/.env
echo "FRED_API_KEY=xxxx" >> supabase/.env
echo "GEMINI_API_KEY=xxxx" >> supabase/.env
echo "GOOGLE_API_KEY=xxxx" >> supabase/.env
echo "SERPAPI_API_KEY=xxxx" >> supabase/.env

# 또는 직접 파일 편집
cat > supabase/.env << EOF
ALPHA_VANTAGE_API_KEY=xxxx
CLAUDE_API_KEY=xxxx
FRED_API_KEY=xxxx
GEMINI_API_KEY=xxxx
GOOGLE_API_KEY=xxxx
SERPAPI_API_KEY=xxxx
EOF
```

## 🧪 5단계: 로컬 테스트

### **5.1 Edge Functions 로컬 실행**
```bash
# Edge Functions 로컬 서버 시작
supabase functions serve

# 특정 함수만 실행
supabase functions serve stock-data --no-verify-jwt

# 다른 터미널에서 함수 테스트
curl -X POST http://localhost:54321/functions/v1/stock-data \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

### **5.2 개별 함수 테스트**
```bash
# 주식 데이터 함수 테스트
curl -X POST "http://localhost:54321/functions/v1/stock-data" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'

# AI 분석 함수 테스트
curl -X POST "http://localhost:54321/functions/v1/ai-analysis" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

## 🚀 6단계: Edge Functions 배포

### **6.1 개별 함수 배포**
```bash
# 모든 함수 배포
supabase functions deploy

# 특정 함수만 배포
supabase functions deploy stock-data
supabase functions deploy ai-analysis
supabase functions deploy news-analysis
supabase functions deploy market-overview
```

### **6.2 배포 상태 확인**
```bash
# 배포된 함수 목록 확인
supabase functions list

# 함수 로그 확인
supabase functions logs stock-data
```

### **6.3 프로덕션 테스트**
```bash
# 프로덕션 URL로 테스트
curl -X POST "https://your-project-id.supabase.co/functions/v1/stock-data" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

## 🔄 7단계: 프론트엔드 API URL 업데이트

### **7.1 프론트엔드 환경변수 **
```bash
# apps/web/.env.local (기존 Railway 설정 교체)
# 기존 제거: NEXT_PUBLIC_API_URL=https://investiegroup-production.up.railway.app

# 이 경로 및 key는 이미 vercel variable에 저장되어있어, 업데이트 불필요.
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_URL=https://fwnmnjwtbggasmunsfyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NTUyOTcsImV4cCI6MjA3MTIzMTI5N30.Q1MfP91L5h86CDkeISBR2Na3GletKN4bA1BZafTiIVM
```

**⚠️ 주의사항:**
- `your-project-id`를 실제 Supabase 프로젝트 ID로 교체
- `your-anon-key`를 Supabase 프로젝트의 실제 anon key로 교체
- Supabase Dashboard → Settings → API에서 확인 가능

### **7.2 API 호출 코드 수정**
기존 Railway URL을 Supabase Edge Functions URL로 변경:

```typescript
// 이전 (Railway)
const response = await fetch('/api/v1/dashboard/AAPL/ai-analysis');

// 이후 (Supabase Edge Functions)
const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/ai-analysis`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ symbol: 'AAPL' })
});
```

### **7.3 SWR Fetcher 업데이트**
```typescript
// 새로운 Supabase Edge Functions용 fetcher
const supabaseFetcher = async (url: string) => {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}${url}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ /* 필요한 파라미터 */ })
  });
  
  if (!response.ok) {
    throw new Error(`Edge Function Error: ${response.status}`);
  }
  
  return response.json();
};
```

## 🗑️ 8단계: Railway 리소스 정리

### **8.1 Railway 환경변수 확인 완료**
✅ **이미 백업된 API Keys:**
- ALPHA_VANTAGE_API_KEY: `***REMOVED***`
- CLAUDE_API_KEY: `***REMOVED***`
- FRED_API_KEY: `***REMOVED***`
- GEMINI_API_KEY: `***REMOVED***`
- GOOGLE_API_KEY: `***REMOVED***`
- SERPAPI_API_KEY: `***REMOVED***`

### **8.2 Railway 서비스 정리 (Supabase 마이그레이션 완료 후)**
- [ ] Railway 프로젝트 삭제 또는 중단
- [ ] Railway 계정 정리 (더 이상 사용하지 않는 경우)

### **8.3 코드베이스에서 Railway 참조 제거**
```bash
# 1. Railway URL 하드코딩 제거
# - apps/web/src/lib/api-utils.ts에서 Railway URL 제거
# - debugFetch에서 Railway fallback 로직 제거

# 2. 환경변수 정리
# apps/web/.env.local에서 제거:
# NEXT_PUBLIC_API_URL=https://investiegroup-production.up.railway.app

# 3. Railway 관련 파일 제거 (있다면)
rm -rf apps/backend/railway.json
rm -rf apps/backend/Dockerfile

# 4. package.json에서 Railway 스크립트 제거
# "deploy:railway": "railway up" 등
```

**⚠️ 정리 시점:**
- Supabase Edge Functions가 완전히 작동하는 것을 확인한 후
- 프론트엔드에서 실시간 데이터가 정상적으로 로드되는 것을 확인한 후

## ✅ 9단계: 마이그레이션 검증

### **9.1 API Keys 마이그레이션 검증**
```bash
# 각 API 키가 정상 작동하는지 확인
# Alpha Vantage API 테스트
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=***REMOVED***"

# FRED API 테스트  
curl "https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=***REMOVED***&file_type=json&limit=1"

# SerpAPI 테스트
curl "https://serpapi.com/search.json?engine=google_news&q=AAPL&api_key=***REMOVED***"
```

### **9.2 Edge Functions 기능 테스트**
```bash
# 주식 데이터 함수 테스트
curl -X POST "https://your-project-id.supabase.co/functions/v1/stock-data" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'

# AI 분석 함수 테스트 (Claude API 사용)
curl -X POST "https://your-project-id.supabase.co/functions/v1/ai-analysis" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

### **9.3 프론트엔드 통합 테스트**
- [ ] AIInvestmentOpinion 컴포넌트에서 AI 분석 데이터 로드
- [ ] StockProfile 컴포넌트에서 Alpha Vantage 데이터 로드
- [ ] AINewsAnalysisReport 컴포넌트에서 SerpAPI + Claude 뉴스 분석
- [ ] MacroIndicatorsDashboard에서 FRED 경제 지표 로드
- [ ] API Debug Panel에서 Supabase 상태 표시

### **9.4 Railway 대비 개선사항 확인**
- [ ] 더 빠른 응답 시간 (글로벌 Edge 위치)
- [ ] 비용 효율성 (사용량 기반 과금)
- [ ] 더 나은 안정성 (99.9% uptime)

## 📊 10단계: 모니터링 및 최적화

### **10.1 Supabase 대시보드 모니터링**
- **Edge Functions** 탭에서 확인 가능한 지표:
  - 실행 횟수 및 성공률
  - 평균 응답 시간
  - 오류 로그 및 스택 트레이스
  - 메모리 사용량

### **10.2 비용 모니터링**
- **Billing** 탭에서 확인:
  - Edge Functions 실행 횟수
  - 데이터베이스 사용량
  - 스토리지 사용량
  - 대역폭 사용량

### **10.3 성능 최적화**
```typescript
// Edge Function 캐싱 예시
const CACHE_TTL = 5 * 60 * 1000; // 5분
const cache = new Map();

export default async function handler(req: Request) {
  const cacheKey = `stock-${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data));
  }
  
  // 실제 API 호출
  const result = await fetchStockData(symbol);
  
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return new Response(JSON.stringify(result));
}
```

## 🎯 예상 효과

### **비용 절감**
- Railway 호스팅 비용 제거
- Serverless 모델로 사용량 기반 과금
- 통합 플랫폼으로 관리 복잡성 감소

### **성능 향상**
- 글로벌 Edge 위치에서 실행
- Cold Start 시간 최소화
- 자동 스케일링

### **운영 효율성**
- 인프라 관리 불필요
- 자동 백업 및 복구
- 통합된 로그 및 모니터링

## ⚠️ 주의사항

### **Edge Functions 제약사항**
- Deno 런타임 사용 (Node.js 아님)
- 일부 npm 패키지 호환성 이슈 가능
- 최대 실행 시간 제한 (일반적으로 60초)

### **API 키 보안**
- Supabase 환경변수에 안전하게 저장
- 클라이언트에서 직접 노출 금지
- 정기적인 키 로테이션 권장

### **데이터베이스 마이그레이션**
- 이미 Supabase에 있다면 스킵
- Railway PostgreSQL 사용 중이라면 별도 마이그레이션 필요

---

## 📞 문제 해결

마이그레이션 과정에서 문제가 발생하면:

1. **Supabase 로그 확인**: `supabase functions logs function-name`
2. **로컬 테스트**: `supabase functions serve`로 로컬에서 디버깅
3. **Supabase 문서**: https://supabase.com/docs/guides/functions
4. **커뮤니티 지원**: Supabase Discord 또는 GitHub Issues

**마이그레이션 완료 후 Railway 의존성 완전 제거 및 비용 효율적인 서버리스 아키텍처 달성!** 🎉