# Vercel 환경변수 설정 가이드

## 🌐 Step 1: Vercel 대시보드에서 환경변수 확인/설정

### 1.1 Vercel 대시보드 접속
1. **https://vercel.com/dashboard** 접속
2. **Investie** 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭

### 1.2 필수 환경변수 설정
다음 2개 변수가 **반드시** 설정되어 있어야 합니다:

```bash
# Frontend → Supabase 연결용
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8
```

### 1.3 환경변수 추가 방법
1. **Add New** 버튼 클릭
2. **Name**: `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`
3. **Value**: `https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1`
4. **Environments**: `Production`, `Preview`, `Development` 모두 체크
5. **Save** 클릭

같은 방식으로 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 추가

## 🔄 Step 2: 변경사항 적용

### 2.1 자동 재배포 (권장)
환경변수 변경 후 **자동으로 재배포**됩니다. 5-10분 소요.

### 2.2 수동 재배포 (즉시 적용)
1. Vercel 대시보드 → **Deployments** 탭
2. 최신 배포 항목에서 **⋯** 메뉴 클릭
3. **Redeploy** 선택

## ✅ Step 3: 설정 확인

### 3.1 프로덕션 사이트에서 확인
```javascript
// 브라우저 개발자 도구 (F12) → Console에서 실행
console.log('SUPABASE_URL:', process?.env?.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL);
console.log('ANON_KEY:', process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

// 결과가 모두 표시되면 정상!
```

### 3.2 Network 탭에서 API 호출 확인
1. **F12** → **Network** 탭
2. 페이지 새로고침
3. `market-overview`, `stock-data` 등의 API 호출이 **200 OK** 상태인지 확인

## 🐛 문제 해결

### 문제 1: 환경변수가 `undefined`로 표시
**원인**: 환경변수명이 `NEXT_PUBLIC_`로 시작하지 않거나 잘못 입력
**해결**: 정확한 이름으로 다시 설정

### 문제 2: API 호출이 실패 (404, 401 에러)
**원인**: Supabase URL 또는 인증 키 오류
**해결**: Supabase 대시보드에서 정확한 값 복사 후 재설정

### 문제 3: 로컬에서는 작동하지만 프로덕션에서 실패
**원인**: Vercel 환경변수 누락
**해결**: 위 단계에 따라 Vercel에서 환경변수 설정

## 🔍 로컬 개발 환경 설정

로컬에서도 같은 환경변수를 사용하려면:

```bash
# apps/web/.env.local 파일 생성/수정
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://fwnmnjwtbggasmunsfyk.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3bm1uand0YmdnYXNtdW5zZnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMTQ0OTcsImV4cCI6MjAzOTY5MDQ5N30.p5f3VIWgz6b2kKgQ4OydRhqf7oEfWvTiP6KSUmhQBT8
```

**주의**: `.env.local` 파일은 Git에 커밋하지 마세요!

## 📊 현재 상태 체크리스트

- [ ] Vercel 환경변수 2개 설정됨
- [ ] 프로덕션 재배포 완료  
- [ ] 브라우저에서 환경변수 확인됨
- [ ] API 호출이 200 상태로 성공
- [ ] 실제 데이터 (0이 아닌 가격) 표시됨

---

*이전: Supabase API 키 설정 가이드*