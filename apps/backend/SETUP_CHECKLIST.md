# 🔧 Supabase Setup Checklist

## 현재 상태
- ✅ SQL 스키마 실행 완료 ("Success. No rows returned" = 정상)
- ✅ 백엔드 코드 준비 완료
- ❌ Service Role Key 환경 변수 누락

## 사용자 작업 필요

### 1. Service Role Key 설정
```bash
# .env.local 파일에 추가
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Service Role Key 찾는 방법:**
1. Supabase 대시보드 → **Settings** → **API**
2. **Project API keys** → **service_role** 키 복사 (⚠️ secret으로 표시됨)

### 2. Supabase 대시보드에서 확인

#### 📋 Table Editor
다음 5개 테이블이 생성되었는지 확인:
- [ ] `ai_analysis`
- [ ] `stock_news`
- [ ] `macro_news`
- [ ] `market_indicators`
- [ ] `stock_profiles`

#### 🔌 Database → Extensions
- [ ] `uuid-ossp` extension 활성화됨

#### 🛡️ Authentication → Policies
각 테이블별로 3개 정책씩 총 15개 정책 확인:
- [ ] `Allow public read access on ai_analysis`
- [ ] `Allow public insert on ai_analysis`
- [ ] `Allow public update on ai_analysis`
- [ ] (stock_news, macro_news, market_indicators, stock_profiles에 대해서도 동일)

### 3. 설정 완료 후 검증

Service Role Key 추가 후 다음 명령어로 전체 검증:
```bash
npm run verify:supabase
```

성공 시 다음과 같이 표시됩니다:
```
✅ Environment Variables: All present
✅ Connection: SUCCESS
✅ Tables: 5/5 exist
✅ RLS Policies: Working
✅ Data Operations: All working
```

### 4. 추가 검증 명령어
```bash
# 마이그레이션 상태만 확인
npm run migrate:status

# 전체 마이그레이션 실행 (필요시)
npm run migrate

# API 서버 시작하여 테스트
npm run start:dev
```

### 5. API 테스트
서버 실행 후 브라우저에서:
```
http://localhost:3000/api/v1/database/health
http://localhost:3000/api/v1/database/tables
http://localhost:3000/api/v1/dashboard/AAPL
```

## 문제 해결

### "Missing required environment variables" 오류
- `.env.local` 파일이 백엔드 폴더에 있는지 확인
- Service Role Key가 정확히 복사되었는지 확인

### "Connection failed" 오류
- Supabase URL과 API 키가 올바른지 확인
- 네트워크 연결 확인

### "Table does not exist" 오류
- Supabase SQL Editor에서 schema.sql을 다시 실행
- 또는 `npm run migrate` 실행

### "RLS Policy" 오류
- Supabase에서 각 테이블의 RLS 설정 확인
- Authentication → Policies에서 정책 확인

## 다음 단계
Service Role Key 설정 완료 후 알려주시면:
1. 전체 검증 실행
2. API 테스트 진행
3. 프론트엔드 연결 준비