# Supabase Edge Functions API 키 설정 가이드

## 🔑 Step 1: Supabase 대시보드에서 Secrets 설정

### 1.1 Supabase 대시보드 접속
1. **https://supabase.com/dashboard** 접속
2. **Investie the Intern** 프로젝트 선택
3. 왼쪽 메뉴에서 **Settings** → **Edge Functions** 클릭

### 1.2 Secrets 설정
**Settings → Edge Functions → Secrets** 에서 다음 키들을 추가:

```bash
# 필수 API 키들
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
CLAUDE_API_KEY=sk-ant-your-claude-key  
SERPAPI_API_KEY=your-serpapi-key

# 선택사항 (더 많은 데이터를 위해)
FRED_API_KEY=your-fred-api-key
```

### 1.3 각 API 키 발급 방법

#### Alpha Vantage (주식 데이터)
1. **https://www.alphavantage.co/support/#api-key** 접속
2. 무료 계정 생성 (일일 25 requests)
3. API 키 복사

#### Claude API (AI 분석)
1. **https://console.anthropic.com** 접속  
2. API Keys 메뉴에서 새 키 생성
3. `sk-ant-`로 시작하는 키 복사

#### SerpAPI (뉴스 데이터)
1. **https://serpapi.com** 접속
2. 무료 계정 생성 (월 100 searches)
3. API 키 복사

#### FRED API (경제 지표) - 선택사항
1. **https://fred.stlouisfed.org/docs/api/api_key.html** 접속
2. 무료 계정 생성
3. API 키 복사

## 🔄 Step 2: Edge Functions 재배포

```bash
# 터미널에서 실행
cd /Users/seinoh/Desktop/github/investie_group
supabase functions deploy
```

## ✅ Step 3: 설정 확인

### 3.1 Edge Function 개별 테스트
```bash
# Market Overview 테스트
curl -X POST https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8" \
  -H "Content-Type: application/json" | jq '.source'

# 결과가 "alpha_vantage"이면 성공!
```

### 3.2 Supabase 로그 확인
1. **Supabase 대시보드** → **Logs** → **Edge Functions**
2. 에러 메시지 확인:
   - `Alpha Vantage API key not configured` → API 키 누락
   - `API rate limit exceeded` → 무료 할당량 초과

## 🚨 즉시 확인사항

현재 Edge Functions에서 **API 키가 설정되어 있지 않을 가능성**이 높습니다.

### 확인 방법
```bash
# Edge Functions 로그 확인
supabase functions logs market-overview --limit 10
```

### 예상 에러 메시지
```
Alpha Vantage API key not configured, using mock data
```

## 💡 Quick Fix - 임시 해결책

API 키 발급이 시간이 걸린다면, **무료 데모 키**로 먼저 테스트:

```bash
# Alpha Vantage 데모 키 (제한적 데이터)
ALPHA_VANTAGE_API_KEY=demo

# 하지만 실제 서비스에는 반드시 실제 API 키 필요!
```

---

*다음: Vercel 환경변수 설정 가이드*