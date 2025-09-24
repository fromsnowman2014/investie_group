# 사용자 매뉴얼: Supabase → Vercel 환경변수 마이그레이션

## 🎯 개요

이 매뉴얼은 Supabase Edge Functions에 저장된 API 키들을 Vercel로 마이그레이션하는 과정을 단계별로 안내합니다.

## 📋 사전 준비사항

### 필요한 도구
- [ ] Vercel 계정 및 프로젝트 액세스
- [ ] Supabase Dashboard 액세스
- [ ] 터미널 접근 권한
- [ ] 현재 API 키 값들

### 현재 API 키 확인

1. **Supabase Dashboard 접속**
   ```
   https://supabase.com/dashboard/project/fwnmnjwtbggasmunsfyk/settings/edge-functions
   ```

2. **Environment Variables 섹션에서 확인할 키들**:
   - `ALPHA_VANTAGE_API_KEY`
   - `FRED_API_KEY`
   - `CLAUDE_API_KEY` (선택사항)
   - `OPENAI_API_KEY` (선택사항)

3. **API 키 값들을 메모장에 복사해 두세요** ⚠️

## 🚀 Step 1: Vercel 환경변수 설정

### 1.1 Vercel Dashboard 접속

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. `investie_group` 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 선택

### 1.2 환경변수 추가

각 환경변수를 다음 형식으로 추가:

#### Production 환경 추가
1. **Name**: `NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY`
   **Value**: `(Supabase에서 복사한 ALPHA_VANTAGE_API_KEY 값)`
   **Environments**: Production ✅

2. **Name**: `NEXT_PUBLIC_FRED_API_KEY`
   **Value**: `(Supabase에서 복사한 FRED_API_KEY 값)`
   **Environments**: Production ✅

3. **Name**: `NEXT_PUBLIC_CLAUDE_API_KEY`
   **Value**: `(Supabase에서 복사한 CLAUDE_API_KEY 값)`
   **Environments**: Production ✅

4. **Name**: `NEXT_PUBLIC_OPENAI_API_KEY`
   **Value**: `(Supabase에서 복사한 OPENAI_API_KEY 값)`
   **Environments**: Production ✅

#### Preview & Development 환경 추가
위와 동일한 키들을 **Preview**와 **Development** 환경에도 추가:
- Preview ✅
- Development ✅

### 1.3 확인 스크린샷
완료 후 다음과 같이 보여야 합니다:
```
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY    Production, Preview, Development
NEXT_PUBLIC_FRED_API_KEY             Production, Preview, Development
NEXT_PUBLIC_CLAUDE_API_KEY           Production, Preview, Development
NEXT_PUBLIC_OPENAI_API_KEY           Production, Preview, Development
```

## 🧪 Step 2: 로컬 환경 테스트

### 2.1 로컬 .env.local 파일 업데이트

`apps/web/.env.local` 파일에 다음 라인 추가:

```bash
# API Keys (마이그레이션 테스트용)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key-here
NEXT_PUBLIC_FRED_API_KEY=your-fred-key-here
NEXT_PUBLIC_CLAUDE_API_KEY=your-claude-key-here
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key-here

# 마이그레이션 Feature Flag
NEXT_PUBLIC_USE_DIRECT_API=false
```

### 2.2 로컬 테스트 실행

```bash
# 프로젝트 루트에서
cd /Users/seinoh/Desktop/github/investie_group

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 2.3 환경변수 확인

브라우저 개발자 도구 → Console에서 실행:
```javascript
console.log('Alpha Vantage Key:', process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not set');
console.log('FRED Key:', process.env.NEXT_PUBLIC_FRED_API_KEY ? 'Set' : 'Not set');
```

## 🔄 Step 3: 마이그레이션 활성화

### 3.1 Feature Flag 활성화

**로컬에서 테스트**:
`apps/web/.env.local` 파일에서:
```bash
NEXT_PUBLIC_USE_DIRECT_API=true  # false → true로 변경
```

**Vercel에서 활성화**:
1. Vercel Dashboard → Environment Variables
2. 새 환경변수 추가:
   - **Name**: `NEXT_PUBLIC_USE_DIRECT_API`
   - **Value**: `true`
   - **Environments**: Production, Preview, Development ✅

### 3.2 배포 및 테스트

```bash
# 변경사항 커밋 및 푸시
git add .
git commit -m "Enable direct API migration flag"
git push origin main
```

Vercel에서 자동 배포 완료 후 프로덕션 사이트에서 테스트.

## 🔍 Step 4: 검증 및 모니터링

### 4.1 기능 검증 체크리스트

#### 메인 페이지에서 확인:
- [ ] 주식 데이터 (AAPL, TSLA 등) 정상 표시
- [ ] Fear & Greed Index 업데이트
- [ ] S&P 500 데이터 표시
- [ ] VIX 데이터 표시
- [ ] 경제 지표 (Treasury, CPI 등) 표시

#### API 상태 확인:
- [ ] API Debugger 패널에서 모든 API 호출 성공
- [ ] 로딩 시간 3초 이내
- [ ] 에러 메시지 없음

### 4.2 문제 발생 시 즉시 롤백

문제가 발생하면 즉시 다음 조치:

1. **즉시 롤백**:
   ```bash
   # Vercel에서 NEXT_PUBLIC_USE_DIRECT_API를 false로 변경
   ```

2. **로그 확인**:
   - 브라우저 개발자 도구 → Network 탭
   - Console 탭에서 에러 메시지 확인

3. **GitHub Issue 생성**:
   - 에러 메시지 스크린샷
   - 브라우저 및 환경 정보
   - 재현 단계

## 📊 Step 5: 성능 모니터링

### 5.1 모니터링 지표

**다음 사항들을 24-48시간 모니터링**:
- [ ] 페이지 로딩 속도
- [ ] API 호출 성공률
- [ ] 데이터 정확성
- [ ] 사용자 오류 보고

### 5.2 성공 기준

✅ **마이그레이션 성공**:
- API 호출 성공률 > 95%
- 페이지 로딩 시간 < 3초
- 데이터 정확성 100%
- 사용자 오류 보고 없음

❌ **마이그레이션 실패**:
- API 호출 실패율 > 5%
- 페이지 로딩 시간 > 5초
- 데이터 불일치 발견
- 사용자 오류 보고 증가

## 🧹 Step 6: 정리 작업 (성공 후)

### 6.1 Supabase 환경변수 제거

⚠️ **마이그레이션이 완전히 성공한 후에만 진행**

1. Supabase Dashboard 접속
2. Edge Functions → Environment Variables
3. 다음 키들 제거:
   - `ALPHA_VANTAGE_API_KEY`
   - `FRED_API_KEY`
   - `CLAUDE_API_KEY`
   - `OPENAI_API_KEY`

### 6.2 불필요한 Edge Functions 제거

```bash
# 사용하지 않는 Edge Functions 제거 (선택사항)
supabase functions delete data-collector
```

### 6.3 문서 업데이트

- [ ] CLAUDE.md 업데이트
- [ ] README.md 업데이트
- [ ] API 문서 업데이트

## 🚨 트러블슈팅

### 문제 1: 환경변수가 설정되지 않음

**증상**: 브라우저에서 `undefined` 표시

**해결책**:
1. Vercel에서 환경변수 재확인
2. 배포 재시작: Vercel Dashboard → Deployments → "Redeploy"
3. 캐시 클리어: 브라우저 새로고침 (Ctrl+F5)

### 문제 2: API 호출 실패

**증상**: API 호출이 계속 실패

**해결책**:
1. API 키 유효성 확인
2. CORS 설정 확인
3. Rate limit 상태 확인
4. 즉시 롤백 (`NEXT_PUBLIC_USE_DIRECT_API=false`)

### 문제 3: 성능 저하

**증상**: 페이지 로딩이 느려짐

**해결책**:
1. 병렬 API 호출 확인
2. 캐시 설정 확인
3. 네트워크 탭에서 병목 지점 확인

## 📞 지원 요청

문제 해결이 어려운 경우:

1. **GitHub Issue 생성**:
   - Repository: investie_group
   - Label: `migration`, `bug`
   - 템플릿: Bug report

2. **필수 포함 정보**:
   - 브라우저 정보 (Chrome, Safari 등)
   - 환경 (Production, Preview, Development)
   - 에러 메시지 전체
   - 재현 단계
   - 스크린샷

3. **즉시 연락**:
   - 심각한 프로덕션 이슈인 경우
   - 사용자 영향도가 높은 경우

## ✅ 완료 체크리스트

마이그레이션 완료 후 다음을 확인:

### 기술적 완료
- [ ] Vercel 환경변수 설정 완료
- [ ] 로컬 테스트 통과
- [ ] 프로덕션 배포 성공
- [ ] 모든 API 호출 정상
- [ ] 성능 지표 양호

### 비즈니스 완료
- [ ] 사용자 영향 없음
- [ ] 데이터 정확성 유지
- [ ] 모니터링 설정 완료
- [ ] 문서 업데이트 완료

### 정리 완료
- [ ] Supabase 불필요 환경변수 제거
- [ ] 코드 정리 완료
- [ ] 롤백 계획 문서화

---

**🎉 축하합니다!**

마이그레이션이 성공적으로 완료되었습니다. 이제 더 안정적이고 투명한 API 관리 시스템을 사용하게 되었습니다.