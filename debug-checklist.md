# 🔥 즉시 실행 디버깅 체크리스트

## ⚡ Step 1: Supabase Edge Functions 로그 확인 (2분)

```bash
# 터미널에서 실행
supabase functions logs market-overview --limit 5
```

**예상 메시지**:
- ❌ `Alpha Vantage API key not configured, using mock data`
- ❌ `API key not found in environment variables`

## ⚡ Step 2: Supabase Secrets 확인/설정 (5분)

### 2.1 대시보드 확인
1. **https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/settings/edge-functions** 접속
2. **Secrets** 탭에서 다음 키들이 있는지 확인:
   - `ALPHA_VANTAGE_API_KEY`
   - `CLAUDE_API_KEY`  
   - `SERPAPI_API_KEY`

### 2.2 없다면 임시 데모 키 설정
```bash
# 즉시 테스트용 (실제 서비스엔 실제 키 필요!)
ALPHA_VANTAGE_API_KEY=demo
```

## ⚡ Step 3: CLI로 즉시 테스트 (1분)

```bash
# Edge Function 직접 테스트
curl -X POST https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1/market-overview \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8" \
  -H "Content-Type: application/json" | jq '.indices.sp500.value'

# 결과가 0이 아닌 숫자가 나와야 함!
```

## ⚡ Step 4: 로컬 개발서버 재시작 (2분)

```bash
# 기존 서버 종료 후 재시작
cd apps/web
npm run dev
```

브라우저에서 **Network 탭** 확인:
- API 응답에서 `currentPrice: 0` → `currentPrice: 실제숫자` 변경 확인

## 🎯 성공 지표

### 변경 전 (현재)
```javascript
currentPrice: 0
priceChange: 0
targetPrice: 0
```

### 변경 후 (목표)
```javascript
currentPrice: 225.50    // 실제 AAPL 가격
priceChange: 2.35       // 실제 변동
targetPrice: 240.00     // AI 예측 가격
```

## 🚨 긴급 문의

위 단계를 실행하고도 문제가 지속된다면:

1. **Supabase 로그 메시지** 복사해서 공유
2. **API 키 발급 여부** 확인 
3. **프로덕션/로컬** 어느 환경에서 테스트 중인지 명시

---

**예상 해결 시간: 10분**  
**핵심 문제: Supabase Edge Functions의 Alpha Vantage API 키 누락**