₩₩₩ refactoring plan을 만든 prompt
역할: 당신은 Test-Driven Development(TDD)를 전문으로 하는 Senior Software Architect입니다.
프로젝트: https://github.com/fromsnowman2014/investie_group 코드베이스 전체 리팩토링.
핵심 목표: 코드의 복잡성을 낮추고, 모듈화를 통해 가독성과 유지보수성을 극대화하여 향후 기능 개발을 용이하게 만듭니다. 기존 기능은 완벽하게 보존되어야 합니다.
리팩토링 규칙:
분석 및 모듈화 계획: 먼저 전체 코드를 분석하여, UI, 상태 관리, API 통신 등 기능 단위로 모듈화하는 리팩토링 계획을 제안하세요.
TDD 기반 단계별 실행: 계획을 승인하면, 각 모듈별로 테스트 코드를 먼저 작성하고 리팩토링을 진행한 후, 테스트를 통과시켜 기능의 무결성을 증명하세요.
테스트 유형 정의: 자동화 가능한 테스트(Unit Test 등)와 사용자의 직접적인 상호작용이 필요한 테스트(UI/UX 검증 등)를 명확히 구분하여 알려주세요.
지속적인 통합 검증: 한 단계가 끝날 때마다 전체 자동화 테스트를 다시 실행하여, 변경으로 인한 예기치 않은 오류(regression) 발생 여부를 즉시 확인하고 해결하세요.
최종 검증 가이드: 모든 리팩토링 및 자동화 테스트가 완료되면, 사용자가 직접 검증해야 할 항목과 그 방법을 TESTING_GUIDE.md 문서로 생성하여 제출하세요.
작업 절차: 당신의 리팩토링 계획을 제가 승인하면, 계획에 따라 단계별 구현을 시작하세요.
₩₩₩

# TDD 기반 전체 코드베이스 리팩토링 계획

## 🔍 코드베이스 분석 결과

### 현재 상태
- **Backend**: 잘 구조화된 NestJS 아키텍처, 6개 주요 모듈
- **Frontend**: React 19 + Next.js 15, 복잡한 컴포넌트 구조
- **테스트**: Backend에 기본적 Unit/E2E 테스트 존재, Frontend 테스트 없음
- **복잡성 문제**: 거대한 서비스 클래스들, 긴 컴포넌트, 순환 의존성

### 리팩토링 우선순위
1. **Backend 서비스 레이어 분해** (복잡도 최고)
2. **Frontend 컴포넌트 모듈화** (가독성 개선)
3. **상태 관리 최적화** (React Context → 모듈화)
4. **API 레이어 개선** (타입 안전성)

## 🧪 TDD 기반 단계별 실행 계획

### Phase 1: Backend 서비스 리팩토링 (TDD)
**대상**: `stocks.service.ts` (705줄), `market.service.ts` 등

**1.1 테스트 코드 작성**
- 기존 기능 동작 보장용 통합 테스트
- 각 분해될 모듈의 단위 테스트
- 모킹 전략 개선

**1.2 서비스 분해**
- `StockDataService` (API 호출)
- `StockTransformService` (데이터 변환)
- `StockCacheService` (캐싱 로직)
- `StockValidationService` (검증)

**1.3 의존성 주입 개선**
- Interface 기반 추상화
- 순환 의존성 해결

### Phase 2: Frontend 컴포넌트 모듈화 (TDD)
**대상**: `MainLayout.tsx`, `Header.tsx`, AI/TradingView 컴포넌트들

**2.1 컴포넌트 테스트 환경 구축**
- React Testing Library 설정
- Mock 서비스 구축
- 시각적 테스트 환경

**2.2 컴포넌트 분해**
- `Layout` → Grid/Section 컴포넌트들
- `Header` → Search/Selector/Navigation
- `AIAnalysis` → Opinion/Profile 분리

**2.3 커스텀 훅 추출**
- API 호출 로직 → `useStockData`
- 상태 관리 → `useWatchlist`

### Phase 3: 상태 관리 최적화 (TDD)
**대상**: Context API, SWR 설정

**3.1 상태 관리 테스트**
- Context 동작 테스트
- SWR 캐싱 테스트
- 상태 변경 시나리오 테스트

**3.2 Context 분해**
- `StockContext` → 단일 책임
- `AppStateContext` (글로벌 상태)
- `UIContext` (UI 상태)

### Phase 4: API 레이어 개선 (TDD)
**대상**: `api.ts`, 타입 정의

**4.1 API 클라이언트 테스트**
- HTTP 요청/응답 모킹
- 에러 핸들링 테스트
- 타입 안전성 검증

**4.2 API 레이어 재구성**
- Resource 별 클라이언트 분리
- 타입 가드 함수
- 에러 바운더리 개선

## 📋 각 단계별 TDD 프로세스

### 테스트 유형 분류

#### 자동화 가능 테스트
- **Unit Tests**: 개별 함수/클래스 동작
- **Integration Tests**: 모듈 간 상호작용
- **API Tests**: 엔드포인트 동작
- **Component Tests**: React 컴포넌트 렌더링

#### 수동 검증 필요 테스트
- **UI/UX 검증**: 시각적 변경사항
- **Performance Tests**: 로딩 속도, 반응성
- **Cross-browser Tests**: 호환성
- **E2E User Flows**: 사용자 시나리오

### TDD 사이클 (각 모듈별)

1. **🔴 Red**: 실패하는 테스트 작성
   ```bash
   npm run test -- --testNamePattern="StockDataService"
   ```

2. **🟢 Green**: 최소 구현으로 테스트 통과
   ```bash
   npm run test:watch
   ```

3. **🔵 Blue**: 코드 개선 (리팩토링)
   ```bash
   npm run test:cov # 커버리지 확인
   ```

4. **🔄 Regression**: 전체 테스트 실행
   ```bash
   npm run test:all
   ```

## 🗂️ 프로젝트 구조 개선안

```
apps/
├── backend/
│   ├── src/
│   │   ├── stocks/
│   │   │   ├── services/        # 분해된 서비스들
│   │   │   ├── interfaces/      # 추상화 인터페이스
│   │   │   └── __tests__/       # 테스트 코드
│   │   └── shared/              # 공통 유틸리티
│   └── test/
│       ├── unit/
│       ├── integration/
│       └── e2e/
└── web/
    ├── src/
    │   ├── components/
    │   │   ├── ui/              # 재사용 UI 컴포넌트
    │   │   ├── features/        # 기능별 컴포넌트
    │   │   └── layouts/         # 레이아웃 컴포넌트
    │   ├── hooks/               # 커스텀 훅
    │   ├── services/            # API 서비스
    │   ├── contexts/            # 상태 관리
    │   └── __tests__/           # 테스트 코드
    └── test/
        ├── components/
        ├── integration/
        └── e2e/
```

## ⚡ 지속적 통합 검증

### 자동화된 검증 파이프라인
```bash
# 각 단계 완료 시 실행
npm run test:pre-deploy  # Backend 전체 테스트
npm run test:frontend    # Frontend 테스트 (새로 구축)
npm run build            # 빌드 검증
npm run lint             # 코드 품질 검증
```

### 회귀 테스트 전략
- 기능 변경 시 관련 테스트 실행
- CI/CD에서 전체 테스트 스위트 실행
- 성능 벤치마크 추적

## 📚 최종 검증 가이드

리팩토링 완료 후 생성할 문서:
- `TESTING_GUIDE.md`: 수동 검증 체크리스트
- `ARCHITECTURE.md`: 새로운 아키텍처 문서
- `MIGRATION_GUIDE.md`: 변경사항 가이드

## ⏱️ 예상 작업 시간

- **Phase 1**: Backend 리팩토링 (15-20시간)
- **Phase 2**: Frontend 모듈화 (10-15시간)  
- **Phase 3**: 상태 관리 개선 (5-8시간)
- **Phase 4**: API 레이어 개선 (5-8시간)
- **문서화 및 검증**: (3-5시간)

**총 예상 시간**: 38-56시간

## 🏁 실행 상태

- [x] 코드베이스 분석 완료
- [x] 리팩토링 계획 수립
- [ ] Phase 1: Backend 서비스 리팩토링 (진행 중)
- [ ] Phase 2: Frontend 컴포넌트 모듈화
- [ ] Phase 3: 상태 관리 최적화
- [ ] Phase 4: API 레이어 개선
- [ ] 문서화 및 최종 검증