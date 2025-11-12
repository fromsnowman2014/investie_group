# Investie Project - 발표 자료

## 1. 프로젝트 개요

### 프로젝트 목적
투자자들이 개별 종목에 대한 투자 의사결정(비중 확대/축소/관망)을 쉽게 내릴 수 있도록, AI가 자동으로 분석한 정보를 제공하는 웹 플랫폼

**핵심 컨셉**: "Investie the Intern" - LLM의 분석 리포트의 일관성이 없는 부분을 유저들에게 알리면서도 일면 유용한 macro/micro 인사이트를 제공하는 AI 인턴 캐릭터

### 제공 정보

#### 🧭 매크로(시장 전반) 정보
- **CNN Fear & Greed Index**: 시장 심리 지표 시각화
- **VIX (변동성 지수)**: 시장 변동성 상태 표시
- **미국 금리**: Fed 기준금리 및 전망
- **CPI/실업률**: 주요 경제 지표 트렌드
- **S&P500/QQQ**: 주요 지수 차트 및 섹터 분석

#### 🔬 마이크로(개별 종목) 정보
- **밸류에이션**: P/E, EPS, 섹터 대비 비교
- **기술적 지표**: RSI, 이동평균선
- **뉴스 분석**: AI 기반 최신 뉴스 요약 및 감성 분석
- **기업 프로필**: AI 생성 비즈니스 분석 (5문장 요약)
- **투자 의견**: BUY/HOLD/SELL 추천 및 신뢰도

### 프로젝트 결과물
- **GitHub**: https://github.com/fromsnowman2014/investie_group
- **Live Demo**: https://investie-group-web.vercel.app
- **기술 스택**: Next.js 15, Claude Sonnet 4.5, TradingView Widgets, Multi-provider API

---

## 2. 시스템 아키텍처

### 기술 스택
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **AI Engine**: Claude Sonnet 4.5 API (Anthropic)
- **Data Sources**: Alpha Vantage, Yahoo Finance, FRED API, SERPAPI
- **Deployment**: Vercel (Frontend), Next.js API Routes (Backend)
- **State Management**: SWR (client-side caching), React Context API
- **Build System**: Turbo monorepo

### 데이터 플로우
```
사용자 요청 → Next.js API Routes → Claude AI / External APIs
→ 서버 캐싱 (30분) → SWR 클라이언트 캐싱 (30분) → UI 렌더링
```

### 주요 특징
- **모노레포 구조**: Turbo를 활용한 효율적 빌드 관리
- **API 최적화**: Multi-provider 전략 + Rate Limit 자동 처리
- **캐싱 전략**: 서버(In-memory 30분) / 클라이언트(SWR 30분) 2단계 캐싱으로 API 비용 절감
- **실시간 갱신**: 장 운영시간 기반 스마트 갱신 (매크로 지표 전용)

---

## 3. 핵심 기능 구현

### 3.1 AI Investment Opinion (투자 의견 생성)

#### 기능 개요
Claude Sonnet 4.5를 활용한 실시간 투자 의견 생성
- **출력**: BUY/HOLD/SELL 추천, 신뢰도 점수(1-100), 투자 기간
- **분석 범위**: 매크로 + 마이크로 통합 분석 (10줄 이내)

#### 구현 아키텍처
```
Next.js API Route (/api/v1/ai-opinion)
└─ Claude Sonnet 4.5 API 호출 (1024 tokens)
└─ In-memory 서버 캐싱 (30분)
└─ SWR 클라이언트 갱신 (10분)
```

#### AI 프롬프트 전략
**역할 설정**: "You are a professional investment analyst"

**분석 데이터**:
- **Macro**: Fear & Greed Index, VIX, Fed Rate, CPI, 실업률, S&P500, 유동성
- **Micro**: P/E, EPS, RSI, 뉴스, 실적, 배당, 애널리스트 목표가

**출력 요구사항**:
1. 정확히 10줄 이내 작성
2. BUY/HOLD/SELL 명확히 명시
3. 주요 리스크/기회 포함
4. 투자 기간 명시 (단기/중기/장기)
5. 신뢰도 점수 (1-100)
6. Macro/Micro 균형 분석
7. 구조화된 형식으로 자동 파싱 가능

**특징**: 구조화된 프롬프트로 일관된 AI 응답 유도

---

### 3.2 Stock Profile (기업 분석)

#### 기능 개요
기업의 비즈니스 펀더멘탈을 AI가 분석하여 5문장으로 요약
- **분석 내용**: 핵심 가치, 비즈니스 모델, 경쟁 우위, 리스크/기회, 재무 건전성

#### 구현 아키텍처
```
Next.js API Route (/api/v1/ai-company-analysis)
└─ Claude Sonnet 4.5 API 호출
└─ 서버 메모리 캐싱 (30분)
└─ SWR 클라이언트 갱신 (30분)
```

#### AI 프롬프트 전략
**역할 설정**: "You are a corporate analysis expert"

**입력 데이터**: 회사명, 섹터, 산업, 시가총액, 직원 수

**출력 형식**:
- 정확히 5문장 (각 50-80단어)
- 투자 추천 없이 펀더멘탈 분석만
- 순서: 핵심가치 → 비즈니스 모델 → 경쟁우위 → 리스크/기회 → 재무상태

**특징**: 투자 의견과 분리된 순수 비즈니스 분석

---

### 3.3 Market Bubble Detector (버블 탐지)

#### 기능 개요
Claude Sonnet 4.5가 10개 카테고리를 종합 분석하여 시장 버블 피크 리스크 판단
- **판정 단계**: Peak / Near-Peak / Elevated / Normal
- **분석 카테고리**: 레버리지, 밸류에이션, IPO, 투기, 금리, 시장폭, 심리, 미디어, 역사패턴, 반대지표

#### 구현 아키텍처
```
Next.js API Route (/api/v1/bubble-analysis)
└─ Claude Sonnet 4.5 API 호출 (2048 tokens)
└─ 서버 캐싱 (30분)
└─ SWR 자동 갱신 (30분)
```

#### 분석 프레임워크 (10개 카테고리)
1. **Leverage & Credit**: 마진 부채, 레버리지 ETF, 기업 부채
2. **Valuations**: CAPE, Buffett Indicator, P/E, P/S
3. **IPO Activity**: 상장 건수, 수익성, SPAC 활동
4. **Speculation**: 밈주식, 0-DTE 옵션, 암호화폐
5. **Monetary Policy**: Fed 금리, 수익률 곡선, QE/QT
6. **Market Breadth**: 상승/하락 비율, VIX, 시장 집중도
7. **Sentiment**: AAII, Put/Call Ratio, 소매 참여율
8. **Media & Culture**: 대중매체 빈도, 유명인 참여, FOMO
9. **Historical Comparison**: 1929/2000/2008/2021 버블 비교
10. **Contrarian Signals**: 내부자 거래, 스마트머니, 신용 스프레드

#### 출력 구조 (JSON)
- **verdict**: 4단계 판정 (peak/near-peak/elevated/normal)
- **indicators**: 10개 지표별 점수/아이콘/요약
- **riskAssessment**: 조정 확률, 취약 섹터, 촉매
- **recommendations**: 보수적/중도/공격적 투자자별 추천

#### UI/UX 특징
- 색상 코딩 경고 시스템 (🔴 피크 / 🟡 경계 / 🟢 정상)
- 지표 매트릭스 그리드
- 역사적 버블 비교
- 반대 의견 제시 (편향 방지)

**특징**: 정량적 지표 + 정성적 신호를 결합한 다차원 버블 분석

---

### 3.4 AI News Analysis (뉴스 분석)

#### 기능 개요
실시간 주식 뉴스를 AI가 분석하여 투자 인사이트 제공
- **분석 항목**: 감성 분석, 시장 영향도, 트레이딩 시그널
- **데이터 소스**: SERPAPI Google News API (최근 7일, 3개 뉴스)

#### 구현 아키텍처
```
Next.js Route Handler
└─ SERPAPI 뉴스 수집 (7일 이내, 3개)
└─ Claude Sonnet 4.5 분석
└─ SWR 프론트엔드 갱신
└─ 30분 캐싱 (API 비용 절감)
```

#### AI 분석 항목
1. **감성 분석**: Positive/Negative/Neutral + 점수화 (0-1)
2. **영향도 평가**: High/Medium/Low 시장 영향도
3. **핵심 포인트**: 각 뉴스당 2-3개 투자 인사이트
4. **시장 영향**: 주가/업계에 미치는 영향 해석
5. **트레이딩 시그널**: 실질적 매매 시그널 (예: "강한 매수 모멘텀", "단기 변동성 주의")

**출력 형식**: 구조화된 JSON (sentiment, impact, keyPoints, tradingSignals)

**특징**: 단순 뉴스 나열이 아닌, AI가 투자 의사결정용 인사이트로 변환

---

### 3.5 Macro Indicators Dashboard (거시경제 지표)

#### 기능 개요
주요 경제 지표를 실시간 대시보드로 제공
- **지표**: S&P 500, NASDAQ, DOW, VIX, CPI, 실업률, Fed Rate

#### 구현 아키텍처
- **Multi-API 전략**: Yahoo Finance (주식 지수) + FRED API (경제 지표) 병렬 호출
- **데이터 플로우**: SWR Hook → 7개 API 병렬 호출 → 데이터 통합 → UI 렌더링

#### 스마트 갱신 시스템
- **장 운영시간** (월-금 9-16시 EST): 5분 자동 갱신
- **장 ��감 후**: 갱신 중지 (API 비용 최적화)
- **Rate Limit 처리**: 자동 폴백 데이터 제공

#### 사용 API
- **Yahoo Finance**: 무료, 실시간 주식 지수
- **FRED API**: 무료, 연방준비제도 경제 지표
- **Alpha Vantage**: 백업 데이터 소스

**특징**: Multi-provider 전략으로 안정성 확보 + 시간 기반 갱신으로 비용 절감

---

### 3.6 TradingView Widget Integration (차트 통합)

#### 기능 개요
TradingView의 무료 임베디드 위젯을 활용하여 전문가급 차트 제공
- **제공 위젯**: Advanced Chart, Company Profile, Top Stories, Technical Analysis, Fundamental Data

#### 구현 방식
- **Dynamic Script Injection**: React useEffect + 런타임 스크립트 로드
- **자동 동기화**: StockProvider Context 기반 심볼 변경 감지 → 위젯 자동 재렌더링

#### 데이터 플로우
```
사용자 주식 선택 (StockProvider Context)
→ 심볼 변경 감지
→ 위젯 재렌더링
→ TradingView 서버에서 실시간 데이터 자동 로드
```

#### 장점
- API Key 불필요 (무료 서비스)
- TradingView가 데이터 갱신 자동 처리
- 클라이언트 사이드 렌더링 (서버 부하 없음)
- 심볼 변경 시 자동 동기화

**특징**: 제로 백엔드 비용으로 전문가급 금융 데이터 제공

---

## 4. 개발 프로세스 및 팀 협업

### 팀 구성 및 역할 변화

#### 초기 업무 분담 (기능별 분리)
- **김경환**: 프론트엔드 (그래프 & 시각화)
- **이은호**: 프론트엔드 (UI/UX & 레이아웃)
- **오세인**: 백엔드 (금융 데이터 API 연동)
- **김재영**: 백엔드 (뉴스 & AI API 연동)

#### 문제점 발견
- API 설계 부재로 프론트엔드-백엔드 통합 시 충돌 발생
- 코드 병합 시 Conflict 문제로 재작업 필요
- 기능 간 의존성 파악 어려움

#### 해결 방안 (Full-stack Feature 단위 분담)
- **변경 후**: 단일 Feature(Frontend + Backend)를 한 사람이 담당
- **효과**: 통합 문제 최소화, 개발 효율성 대폭 향상

---

## 5. AI 코딩(Vibe Coding) 경험 및 학습

### 초기 개발 (1-2일)
- **성과**: 구조 설계 및 초기 기능 동작 버전 빠르게 완성
- **방법**: 바이브 코딩으로 Rough한 프로토타입 구현

### 복잡도 증가 시 문제점
- **현상**: 코드 복잡도가 높아질수록 간단한 구현도 실패
- **원인**: LLM이 전체 컨텍스트를 충분히 이해하지 못함
- **해결**: 세밀한 가이드라인, 소스 코드, 세분화된 컨텍스트를 정확히 제공

### 디버깅 프로세스
- **실제 엔지니어 방식 적용**: Debug Log 추가 → 분석 → Root Cause 좁히기 → 재디버깅
- **필요 역량**: 해당 분야의 Vertical 지식 필수
- **초보자 접근**: LLM과 함께 코드, 기능, 상태를 학습하며 진행

### 주요 학습 내용
1. **명확한 컨텍스트 제공**: 복잡한 기능일수록 상세한 설명 필요
2. **단계적 디버깅**: Claude code를 이용해 실제 개발할때처럼 로그추가/분석하는 반복하는 과정으로 디버깅
3. **도메인 지식 중요성**: LLM은 도구일 뿐, 엔지니어의 이해가 핵심
4. **리펙토링**: 코드가 복잡한 경우 디버깅, 개선이 어려워져, 주기적으로 refactoring으로 코드 개선 필요함

---

## 6. 개발 중 어려웠던 점 및 해결

### 6.1 협업 Conflict 문제
- **문제**: 바이브 코딩으로 Frontend/Backend 병합 시 Conflict
- **영향**: 코드 재작업 및 시간 손실
- **해결**: 시행착오후 후반작업은 Feature 단위로 Full-stack 책임 분담 개발

### 6.2 Supabase 백엔드 배포 이슈
- **문제**: Local에서는 정상 작동했으나 Supabase 배포 후 Database 연동 실패(관련지식 부족)
- **해결**: Database 의존성 제거 → Frontend에서 API Key 직접 사용 방식으로 단순화

### 6.3 디버깅 시간 증가
- **문제**: 소스 규모 증가로 바이브 코딩 디버깅 어려움
- **해결**: 실제 엔지니어처럼 로그 추가 → 분석 → 반복 디버깅 프로세스 적용

---

## 7. 프로젝트 성과 및 의의

### 기술적 성과
- **AI 통합**: Claude Sonnet 4.5를 활용한 4가지 핵심 AI 기능 구현
- **Multi-provider API**: 안정성과 비용 효율성 동시 달성
- **실시간 데이터**: 스마트 갱신 시스템으로 사용자 경험 최적화
- **캐싱 전략**: 서버/클라이언트 2단계 캐싱으로 API 비용 90% 절감

### 협업 및 프로세스 개선
- **Feature 단위 개발**: 통합 문제 최소화
- **AI 코딩 활용**: 초기 개발 속도 향상
- **체계적 디버깅**: 수작업으로 디버깅하듯 LLM에게 로그 기반 디버깅하게 해서 문제 해결


---

## 8. 향후 개선 방향

### 기능 확장
- 포트폴리오 추적 기능
- 알림 시스템 (가격 변동, 뉴스)
- 사용자 맞춤형 AI 인사이트

### 기술 개선
- AI 모델 파인튜닝 (투자 분석 특화)
- 더 많은 Data Provider 통합
- 모바일 앱 개발

### 사용자 경험
- 대시보드 커스터마이징
- 소셜 기능 (투자 의견 공유)
