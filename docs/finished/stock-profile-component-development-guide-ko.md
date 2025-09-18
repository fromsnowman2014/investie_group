# 주식 프로필 컴포넌트 개선 가이드

## 🎯 개요

이 가이드는 Investie 애플리케이션의 기존 주식 프로필 컴포넌트를 개선하기 위한 **실용적이고 점진적인 접근법**을 제시합니다. 현재 구현(`StockProfile.tsx`)은 잘 설계되어 있고 완전히 작동합니다. 이 개선 전략은 **기존 기능을 보존**하면서 확립된 디자인 시스템과 UI 일관성을 유지하는 **모듈형 확장**을 통해 새로운 기능을 추가하는 데 중점을 둡니다.

### 🔑 핵심 원칙
- **기존 기능 보존**: 현재 StockProfile에 대한 중단 변경 없음
- **점진적 개선**: 선택적이고 확장 가능한 섹션으로 기능 추가
- **UI 일관성**: 기존 `FinancialExpandableSection` 패턴 활용
- **데이터 통합**: 기존 Supabase Edge Functions와 SWR 패턴 활용
- **최소한의 중단**: 현재 MainLayout 슬롯 할당 내에서 개선

## 📋 현재 구현 분석

### ✅ 기존 주식 프로필 컴포넌트
- **위치**: `apps/web/src/app/components/AIAnalysis/StockProfile.tsx`
- **현재 데이터 소스**: `apiFetch` 유틸리티를 통한 커스텀 프로필 엔드포인트
- **기능**: 회사 헤더, 주요 지표(시가총액, P/E, 배당수익률), 확장 가능한 회사 정보
- **UI 아키텍처**:
  - 확장 가능한 콘텐츠 영역을 위한 `FinancialExpandableSection`
  - CSS 변수 기반 디자인 시스템(`globals.css`)
  - 반응형 스켈레톤 로딩 상태
  - 일관된 오류 처리
- **상태 관리**: 5분 새로고침 간격의 SWR
- **데이터 포맷팅**: 시가총액 및 숫자 포맷팅을 위한 유틸리티 함수

### ✅ 사용 가능한 데이터 소스 (Supabase Edge Functions)
- **주식 데이터**: `/functions/v1/stock-data` - 실시간 가격, 시장 데이터, 요율 제한 처리
- **AI 분석**: `/functions/v1/ai-analysis` - 투자 인사이트 및 권장사항
- **뉴스 분석**: `/functions/v1/news-analysis` - 감정 및 뉴스 상관관계
- **시장 개요**: `/functions/v1/market-overview` - 거시 지표 및 섹터 데이터

### ✅ 디자인 시스템 통합
- **레이아웃**: `MainLayout` `stock-profile-section` (2행, 좌측 절반) 내에서 맞춤
- **CSS 변수**: 금융 색상 시스템, 타이포그래피 스케일, 간격 시스템
- **UI 패턴**:
  - 우선순위 레벨이 있는 `FinancialExpandableSection` (중요/중요/보조)
  - 일관된 지표 표시를 위한 `data-row`, `data-label`, `data-value` 클래스
  - 스켈레톤 로딩 및 오류 상태
- **반응형 디자인**: 태블릿/데스크톱 브레이크포인트가 있는 모바일 우선

## 🎯 개선 전략

### 접근법: **모듈형 확장**
기존 StockProfile에 현재 구현 아래에 **선택적이고 확장 가능한 섹션**을 추가하여 개선합니다. 각 개선사항은 확립된 `FinancialExpandableSection` 패턴을 사용합니다.

### 1단계: 실시간 데이터 통합 (1-2일)
**목표**: 현재 구조를 변경하지 않고 기존 프로필에 실시간 시장 데이터 추가

#### 1.1 실시간 가격 헤더
- **구현**: 기존 회사 헤더 위에 가격 티커 추가
- **데이터 소스**: 기존 `edgeFunctionFetcher('stock-data', { symbol })`
- **기능**:
  - 현재 가격, 변화, 변화율
  - CSS 변수를 사용한 색상 코딩된 손익
  - 사용자 친화적 메시징으로 요율 제한 처리
  - 최적의 API 키를 사용한 실시간 느낌의 1분 새로고침 간격
  - Interface는 Market indicators처럼 간결하고 한줄로 표현, 가능한 최소한의 layout 공간으로 표현

#### 1.2 향상된 주요 지표
- **구현**: 기존 주요 지표 섹션 확장
- **데이터 통합**: 프로필 데이터와 주식 데이터 응답 결합
- **추가 지표**:
  - 최선의 그리고 최적의 API key이용
  - 거래량 (기존 유틸리티로 포맷팅)
  - 52주 최고/최저
  - P/E 비율 (주식 데이터에서 향상)
  - 시가총액 (실시간 데이터로 업데이트)

### 2단계: AI 분석 통합 (2-3일)
**목표**: 기존 패턴을 사용하여 확장 가능한 섹션으로 AI 인사이트 추가

#### 2.1 AI 투자 요약 섹션
- **구현**: `dataType="analysis"` 및 `priority="critical"`이 있는 새로운 `FinancialExpandableSection`
- **데이터 소스**: `edgeFunctionFetcher('ai-analysis', { symbol })`
- **UI 컴포넌트**:
  - 권장사항 배지 (기존 배지 스타일링 사용)
  - 색상 코딩된 지표가 있는 신뢰도 점수
  - 글머리 기호 포인트로 주요 요인
  - CSS 변수의 경고 색상을 사용한 위험 평가
- **확장 가능한 콘텐츠**: 상세한 분석 이유

#### 2.2 시장 감정 섹션
- **구현**: `dataType="news"` 및 `priority="important"`이 있는 `FinancialExpandableSection`
- **데이터 소스**: `edgeFunctionFetcher('news-analysis', { symbol })`
- **기능**:
  - 감정 지표 (긍정적/중립적/부정적)
  - 최근 뉴스 영향 요약
  - 소셜 감정 동향 (가능한 경우)
- **확장 가능한 콘텐츠**: 감정 점수가 있는 최근 뉴스 헤드라인

#### 2.3 기술적 지표 미리보기
- **구현**: 기존 주요 지표 스타일의 컴팩트한 기술적 지표
- **데이터 소스**: 주식 데이터 또는 시장 개요 함수의 기술적 데이터
- **표시**:
  - 과매수/과매도 상태가 있는 RSI
  - 이동평균 신호 (강세/약세 교차)
  - 거래량 추세 지표
- **확장 가능**: 전용 섹션의 전체 기술적 분석

### 3단계: 고급 기능 (3-4일)
**목표**: 공간 제약 내에서 대화형 및 비교 기능 추가

#### 3.1 섹터 비교 미니 위젯
- **구현**: `FinancialExpandableSection`의 컴팩트한 비교 테이블
- **데이터 소스**: 섹터 데이터를 위한 `edgeFunctionFetcher('market-overview')`
- **기능**:
  - 현재 주식 vs 섹터 평균 (P/E, 시가총액)
  - 섹터 성과 순위
  - 피어 비교 (상위 3개 유사 주식)
- **UI**: 기존 `data-row` 스타일링을 사용한 테이블 형식

#### 3.2 가격 성과 지표
- **구현**: 간단한 차트 또는 성과 막대
- **데이터 통합**: 주식 데이터에서 성과 지표 계산
- **표시**:
  - 1일, 1주, 1개월, 3개월 성과 백분율
  - S&P 500 대비 색상 코딩된 성과
  - 변동성 지표
- **공간 효율적**: 수평 진행률 막대 또는 미니 스파크라인

#### 3.3 빠른 작업 도구 모음
- **구현**: 주요 지표 아래의 미묘한 작업 버튼
- **기능**:
  - 심볼을 클립보드에 복사
  - 주식 프로필 공유 (URL 생성)
  - 전체 TradingView 차트에서 보기 (차트 섹션으로 링크)
- **스타일링**: 툴팁이 있는 작고 아이콘 기반 버튼

## 🏗️ 기술적 구현 전략

### 모듈형 개선 접근법
**기존 `StockProfile.tsx`를 기반으로 유지하고 확장으로 기능 추가**

```typescript
// 향상된 StockProfile 구조 (점진적)
StockProfile.tsx              // 현재 컴포넌트 (보존됨)
├── 핵심 기능 (변경되지 않음)
│   ├── 회사 정보가 있는 프로필 헤더
│   ├── 주요 지표 표시
│   └── 회사 정보 (FinancialExpandableSection)
├── 1단계 개선사항
│   ├── 실시간 가격 티커 (헤더 위)
│   └── 향상된 지표 (추가 데이터 행)
├── 2단계 개선사항
│   ├── AI 분석 섹션 (새로운 FinancialExpandableSection)
│   ├── 시장 감정 섹션 (새로운 FinancialExpandableSection)
│   └── 기술적 지표 (확장된 지표)
└── 3단계 개선사항
    ├── 섹터 비교 (새로운 FinancialExpandableSection)
    ├── 성과 지표 (시각적 지표)
    └── 빠른 작업 도구 모음 (최소 UI)

// 지원 유틸리티 (새 파일)
utils/
├── stockDataFormatters.ts    // 기존 포맷터 확장
├── financialCalculations.ts  // 성과 및 비율 계산
└── aiDataFormatters.ts       // AI 응답 포맷팅

// 타입 확장 (새 파일)
types/
└── enhancedStockProfile.ts   // 새 데이터용 추가 인터페이스
```

### 데이터 통합 전략
**점진적 데이터 페칭으로 기존 Supabase Edge Functions 활용**

```typescript
// 데이터 소스 통합
interface StockProfileDataSources {
  // 기존 프로필 데이터 (보존됨)
  profileData: StockProfileData; // 현재 인터페이스

  // 1단계: 실시간 시장 데이터
  marketData?: {
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    marketCap?: number;
    pe?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    source: string;
    alphaVantageRateLimit?: RateLimitInfo;
  };

  // 2단계: AI 인사이트 (선택사항)
  aiAnalysis?: {
    recommendation: string;
    confidence: number;
    summary: string;
    factors: string[];
    risk: 'low' | 'medium' | 'high';
  };

  // 2단계: 뉴스 감정 (선택사항)
  newsSentiment?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    headlines: NewsItem[];
  };

  // 3단계: 섹터 컨텍스트 (선택사항)
  sectorComparison?: {
    sectorName: string;
    sectorAverage: number;
    ranking: number;
    peers: PeerStock[];
  };
}

// 점진적 데이터 페칭 전략
const useEnhancedStockProfile = (symbol: string) => {
  // 핵심 프로필 데이터 (기존, 변경되지 않음)
  const { data: profileData } = useSWR(
    symbol ? `/api/v1/dashboard/${symbol}/profile` : null,
    fetcher,
    { refreshInterval: 300000 }
  );

  // 실시간 시장 데이터 (1단계)
  const { data: marketData } = useSWR(
    symbol ? `stock-data-${symbol}` : null,
    () => edgeFunctionFetcher('stock-data', { symbol }),
    { refreshInterval: 60000 } // 가격 업데이트용 1분
  );

  // AI 분석 (2단계, 조건부)
  const { data: aiData } = useSWR(
    symbol ? `ai-analysis-${symbol}` : null,
    () => edgeFunctionFetcher('ai-analysis', { symbol }),
    { refreshInterval: 300000 } // AI 업데이트용 5분
  );

  return {
    profileData,
    marketData,
    aiData,
    isLoading: !profileData,
    hasEnhancedData: !!(marketData || aiData)
  };
};
```

### 구현 코드 예시

```typescript
// 향상된 StockProfile 컴포넌트 (기존 컴포넌트 수정)
export default function StockProfile({ symbol }: StockProfileProps) {
  // 기존 프로필 데이터 (변경되지 않음)
  const { data: profileData, error, isLoading } = useSWR<StockProfileData>(
    symbol ? `/api/v1/dashboard/${symbol}/profile` : null,
    fetcher,
    { refreshInterval: 300000 }
  );

  // 새로운: 실시간 시장 데이터
  const { data: marketData } = useSWR(
    symbol ? `stock-data-${symbol}` : null,
    () => edgeFunctionFetcher('stock-data', { symbol }),
    { refreshInterval: 60000 }
  );

  // 새로운: AI 분석 (조건부)
  const { data: aiData } = useSWR(
    symbol ? `ai-analysis-${symbol}` : null,
    () => edgeFunctionFetcher('ai-analysis', { symbol }),
    { refreshInterval: 300000 }
  );

  // 기존 로딩/오류 상태 (변경되지 않음)
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay />;
  if (!profileData) return <EmptyState />;

  return (
    <div className="stock-profile">
      {/* 새로운: 실시간 가격 티커 */}
      {marketData && (
        <div className="price-ticker mb-2">
          <PriceDisplay marketData={marketData} />
        </div>
      )}

      {/* 기존: 회사 헤더 (변경되지 않음) */}
      <div className="profile-header data-density-high">
        {/* 기존 헤더 코드 */}
      </div>

      {/* 향상된: 주요 지표 (시장 데이터 추가) */}
      <div className="key-metrics space-y-1">
        {/* 기존 지표 */}
        {marketData && (
          <>
            <div className="data-row">
              <span className="data-label">거래량</span>
              <span className="data-value financial-data">
                {formatNumber(marketData.volume)}
              </span>
            </div>
            {/* 추가 지표 */}
          </>
        )}
      </div>

      {/* 새로운: AI 분석 섹션 */}
      {aiData && (
        <FinancialExpandableSection
          title="AI 투자 분석"
          dataType="analysis"
          priority="critical"
          className="mt-4"
        >
          <AIAnalysisDisplay data={aiData} />
        </FinancialExpandableSection>
      )}

      {/* 기존: 회사 정보 (변경되지 않음) */}
      <FinancialExpandableSection
        title="회사 정보"
        dataType="profile"
        priority="supplementary"
        initialHeight={{
          mobile: 120,
          tablet: 150,
          desktop: 180
        }}
        className="mt-4"
      >
        {/* 기존 회사 정보 코드 */}
      </FinancialExpandableSection>
    </div>
  );
}
```

## 📊 UI/UX 디자인 가이드라인

### 디자인 원칙
**기존 시각적 계층 구조를 유지하고 할당된 공간 내에서 수직으로 확장**

```css
/* 주식 프로필 향상 스타일 */
.stock-profile {
  /* 기존 구조 보존 */
  /* 추가 요소로 개선사항 추가 */
}

/* 새로운: 가격 티커 스타일 */
.price-ticker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-sm);
}

.price-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.current-price {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

.price-change {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.price-change.positive {
  color: var(--color-positive);
}

.price-change.negative {
  color: var(--color-negative);
}

.price-change.neutral {
  color: var(--color-neutral);
}

/* 요율 제한 경고 스타일 */
.rate-limit-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: #fef3cd;
  color: #8a6914;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

/* AI 분석 표시 스타일 */
.ai-recommendation {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.ai-recommendation.buy {
  background: #d4edda;
  color: #155724;
}

.ai-recommendation.hold {
  background: #fff3cd;
  color: #856404;
}

.ai-recommendation.sell {
  background: #f8d7da;
  color: #721c24;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.confidence-bar {
  width: 60px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.confidence-fill.high {
  background: var(--color-high-confidence);
}

.confidence-fill.medium {
  background: var(--color-medium-confidence);
}

.confidence-fill.low {
  background: var(--color-low-confidence);
}

/* 빠른 작업 스타일 */
.quick-actions {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  background: var(--color-surface);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 반응형 동작 유지 */
@media (max-width: 768px) {
  .price-ticker {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .price-display {
    width: 100%;
    justify-content: space-between;
  }

  .quick-actions {
    flex-wrap: wrap;
  }
}
```

### 시각적 디자인 시스템
```typescript
// 금융 데이터용 색상 체계
const FINANCIAL_COLORS = {
  positive: '#10B981', // 수익을 위한 녹색
  negative: '#EF4444', // 손실을 위한 빨간색
  neutral: '#6B7280',  // 중립을 위한 회색
  warning: '#F59E0B',  // 주의를 위한 앰버
  info: '#3B82F6',     // 정보를 위한 파란색

  // 위험 레벨
  riskLow: '#10B981',
  riskMedium: '#F59E0B',
  riskHigh: '#EF4444',

  // AI 신뢰도 레벨
  confidenceHigh: '#10B981',
  confidenceMedium: '#F59E0B',
  confidenceLow: '#EF4444',
};

// 금융 데이터용 타이포그래피
const FINANCIAL_TYPOGRAPHY = {
  price: 'text-2xl font-bold',
  change: 'text-lg font-semibold',
  metric: 'text-sm font-medium',
  label: 'text-xs text-gray-600',
  highlight: 'text-lg font-bold text-blue-600',
};
```

## 🛠️ 구현 단계

### 1단계: 실시간 시장 데이터 통합 (1-2일)
**우선순위**: 높음 | **노력**: 8-12시간

#### 작업:
1. **가격 티커 컴포넌트 추가** (3-4시간)
   - [ ] 시장 데이터용 `PriceDisplay` 컴포넌트 생성
   - [ ] `edgeFunctionFetcher('stock-data')` 통합
   - [ ] 요율 제한 경고 표시 추가
   - [ ] 기존 CSS 변수 시스템으로 스타일링

2. **주요 지표 섹션 향상** (2-3시간)
   - [ ] 기존 지표에 거래량, 52주 고/저 추가
   - [ ] 시장 데이터와 프로필 데이터 병합
   - [ ] 새 지표용 포맷팅 유틸리티 업데이트
   - [ ] 기존 `data-row` 스타일링 유지

3. **오류 처리 & 로딩 상태** (2-3시간)
   - [ ] 요율 제한을 우아하게 처리
   - [ ] 새 섹션용 스켈레톤 상태 추가
   - [ ] 시장 데이터 실패 시 기존 데이터로 폴백 구현
   - [ ] 모의 및 실제 데이터로 테스트

4. **테스트 & 개선** (1-2시간)
   - [ ] 지원되는 모든 심볼로 테스트
   - [ ] 반응형 동작 확인
   - [ ] 성능 영향 확인
   - [ ] 데이터 새로고침 비율 검증

#### 성공 기준:
- [ ] 실시간 가격 데이터가 기존 헤더 위에 표시됨
- [ ] 향상된 지표가 거래량 및 52주 범위를 보여줌
- [ ] 적절한 경우 요율 제한 경고가 나타남
- [ ] 기존 프로필 섹션에 시각적 중단 없음
- [ ] 컴포넌트가 500px 높이 제약을 유지함

### 2단계: AI 분석 통합 (2-3일)
**우선순위**: 높음 | **노력**: 12-16시간

#### 작업:
1. **AI 분석 섹션** (4-5시간)
   - [ ] `AIAnalysisDisplay` 컴포넌트 생성
   - [ ] `edgeFunctionFetcher('ai-analysis')` 통합
   - [ ] CSS 스타일링으로 권장사항 배지 추가
   - [ ] 신뢰도 점수 시각화 구현
   - [ ] 주요 요인을 포맷된 목록으로 표시

2. **뉴스 감정 섹션** (3-4시간)
   - [ ] `NewsSentimentDisplay` 컴포넌트 생성
   - [ ] `edgeFunctionFetcher('news-analysis')` 통합
   - [ ] 색상 코딩으로 감정 지표 추가
   - [ ] 확장 가능한 형식으로 최근 헤드라인 표시
   - [ ] 감정 점수 시각화 구현

3. **기술적 지표 미리보기** (3-4시간)
   - [ ] 주요 지표 섹션에 기본 기술적 지표 추가
   - [ ] 상태 지표로 RSI 표시
   - [ ] 이동평균 신호 보여주기
   - [ ] 거래량 추세 지표 추가
   - [ ] 기존 data-row 스타일링 사용

4. **통합 & 정리** (2-3시간)
   - [ ] `FinancialExpandableSection` 래퍼 추가
   - [ ] 데이터 가용성에 따른 조건부 렌더링 구현
   - [ ] AI 섹션용 로딩 상태 추가
   - [ ] API 실패에 대한 오류 처리 테스트

#### 성공 기준:
- [ ] AI 권장사항이 신뢰도 점수와 함께 표시됨
- [ ] 뉴스 감정이 색상 코딩된 지표로 표시됨
- [ ] 기술적 지표가 중단 없이 지표에 나타남
- [ ] 섹션이 적절히 확장/축소됨
- [ ] AI 데이터를 사용할 수 없을 때 우아한 처리

### 3단계: 비교 기능 (2-3일)
**우선순위**: 중간 | **노력**: 10-14시간

#### 작업:
1. **섹터 비교 위젯** (4-5시간)
   - [ ] `SectorComparisonDisplay` 컴포넌트 생성
   - [ ] `edgeFunctionFetcher('market-overview')` 통합
   - [ ] 현재 주식 vs 섹터 평균 표시
   - [ ] 섹터 내 순위 보여주기
   - [ ] 피어 비교 테이블 추가

2. **성과 지표** (3-4시간)
   - [ ] 주식 데이터에서 성과 지표 계산
   - [ ] 성과 막대/지표 생성
   - [ ] 1일, 1주, 1개월, 3개월 성과 보여주기
   - [ ] 변동성 지표 추가
   - [ ] 시장 성과 대비 색상 코딩

3. **빠른 작업 도구 모음** (2-3시간)
   - [ ] 컴팩트한 작업 버튼 생성
   - [ ] 심볼 복사 기능 추가
   - [ ] 공유 URL 생성 구현
   - [ ] TradingView 차트 섹션으로 링크 추가
   - [ ] 기존 버튼 패턴으로 스타일링

4. **모바일 최적화 & 테스트** (1-2시간)
   - [ ] 모바일에서 반응형 동작 보장
   - [ ] 작은 화면에서 섹션 축소 테스트
   - [ ] 터치 상호작용 확인
   - [ ] 모바일 보기용 데이터 밀도 최적화

#### 성공 기준:
- [ ] 섹터 비교가 관련 컨텍스트 제공
- [ ] 성과 지표가 시각적으로 명확함
- [ ] 빠른 작업이 모든 기기에서 작동
- [ ] 컴포넌트가 모바일에서 사용성 유지
- [ ] 모든 기능이 기존 레이아웃과 원활하게 통합

### 4단계: 최적화 & 정리 (1-2일)
**우선순위**: 낮음 | **노력**: 6-10시간

#### 작업:
1. **성능 최적화** (2-3시간)
   - [ ] 서브 컴포넌트용 React.memo 구현
   - [ ] 데이터 유형에 따른 SWR 새로고침 간격 최적화
   - [ ] 조건부 데이터 페칭 추가 (표시될 때만 AI 데이터 페치)
   - [ ] useMemo/useCallback으로 재렌더링 최소화
   - [ ] 컴포넌트 렌더링 성능 프로파일링

2. **오류 처리 & 복원력** (2-3시간)
   - [ ] 포괄적인 오류 경계 추가
   - [ ] 실패한 API 호출에 대한 재시도 로직 구현
   - [ ] 누락된 데이터에 대한 우아한 성능 저하 추가
   - [ ] 사용자 친화적 오류 메시지 생성
   - [ ] 엣지 케이스 테스트 (네트워크 실패, 잘못된 심볼)

3. **접근성 & 테스트** (2-4시간)
   - [ ] 금융 데이터용 ARIA 레이블 추가
   - [ ] 확장 가능한 섹션용 키보드 탐색 구현
   - [ ] 스크린 리더 호환성 테스트
   - [ ] 새 유틸리티 및 포맷터용 단위 테스트 추가
   - [ ] 데이터 페칭용 통합 테스트 생성

#### 성공 기준:
- [ ] 컴포넌트가 여러 데이터 소스로 효율적으로 렌더링
- [ ] 사용자 친화적 메시지로 강력한 오류 처리
- [ ] 금융 데이터에 대한 접근성 표준 충족
- [ ] 새 기능에 대한 테스트 커버리지
- [ ] 성능 영향 최소화

## 🧪 테스트 전략

### 테스트 접근법
**기존 기능을 중단하지 않고 개선사항 테스트에 집중**

### 단위 테스트
```typescript
// 향상된 StockProfile용 테스트 구조
describe('향상된 StockProfile 컴포넌트', () => {
  describe('핵심 기능 (기존)', () => {
    it('회사 프로필 데이터를 올바르게 표시해야 함');
    it('스켈레톤으로 로딩 상태를 적절히 처리해야 함');
    it('프로필 API 실패 시 오류 상태를 보여줘야 함');
    it('기존 주요 지표 표시를 유지해야 함');
  });

  describe('1단계: 실시간 데이터 통합', () => {
    it('시장 데이터 사용 가능할 때 가격 티커를 표시해야 함');
    it('요율 제한 경고를 우아하게 처리해야 함');
    it('시장 데이터로 주요 지표를 향상시켜야 함');
    it('시장 데이터 실패 시 프로필 데이터로 폴백해야 함');
    it('올바른 색상으로 가격 변화를 포맷해야 함');
  });

  describe('2단계: AI 분석 통합', () => {
    it('데이터 사용 가능할 때 AI 권장사항을 표시해야 함');
    it('적절한 스타일링으로 신뢰도 점수를 보여줘야 함');
    it('색상 코딩으로 뉴스 감정을 렌더링해야 함');
    it('데이터 사용 불가할 때 AI 섹션을 숨겨야 함');
    it('AI 섹션을 적절히 확장/축소해야 함');
  });

  describe('3단계: 비교 기능', () => {
    it('데이터 사용 가능할 때 섹터 비교를 표시해야 함');
    it('성과 지표를 올바르게 계산해야 함');
    it('빠른 작업 도구 모음을 렌더링해야 함');
    it('누락된 섹터 데이터를 우아하게 처리해야 함');
  });

  describe('데이터 페칭 & SWR 통합', () => {
    it('여러 데이터 소스를 독립적으로 페치해야 함');
    it('다른 새로고침 간격을 올바르게 처리해야 함');
    it('프로필 데이터에 대한 캐시를 유지해야 함');
    it('실패한 API 호출을 적절히 재시도해야 함');
  });

  describe('반응형 디자인', () => {
    it('모바일에서 가격 티커를 스택해야 함');
    it('모든 화면 크기에서 섹션 확장성을 유지해야 함');
    it('기존 모바일 동작을 보존해야 함');
    it('긴 텍스트를 우아하게 처리해야 함');
  });
});

// 유틸리티 테스트
describe('향상된 포맷터', () => {
  it('올바른 부호로 가격 변화를 포맷해야 함');
  it('큰 거래량 숫자를 처리해야 함');
  it('성과 백분율을 올바르게 계산해야 함');
  it('신뢰도 점수를 적절히 포맷해야 함');
});
```

### 통합 테스트
- [ ] 지원되는 모든 주식 심볼로 테스트
- [ ] API 오류 처리 및 폴백 확인
- [ ] 실시간 데이터 업데이트 테스트
- [ ] 크로스 컴포넌트 상태 관리 검증

### 성능 테스트
- [ ] 컴포넌트 렌더링 시간 측정
- [ ] 대용량 데이터셋으로 테스트
- [ ] 확장된 세션 중 메모리 사용량 검증
- [ ] 메모리 누수 확인

## 🚀 배포 전략

### 환경 구성
**기존 Supabase Edge Functions 설정 사용 (추가 환경 변수 불필요)**

```bash
# 프론트엔드 환경 (이미 구성됨)
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Edge Functions (이미 구성됨)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key  # 실제 주식 데이터용
# 사용 가능한 추가 함수용 기타 API 키
```

### 배포 프로세스
```bash
# 1. 로컬에서 향상된 컴포넌트 테스트
cd apps/web
npm run dev

# 2. TypeScript 컴파일 확인
npm run typecheck

# 3. 프로덕션 빌드 테스트
npm run build

# 4. Vercel에 배포 (main 브랜치 푸시 시 자동)
# 프론트엔드 배포가 향상된 StockProfile을 자동으로 처리

# 5. Supabase Edge Functions 확인
# 함수가 이미 배포되어 작동 중
# 개선사항에 추가 배포 불필요
```

### 기능 플래그 & 점진적 롤아웃
```typescript
// 선택사항: 점진적 롤아웃용 기능 플래그
const ENABLE_ENHANCED_FEATURES = {
  realTimeData: true,     // 1단계
  aiAnalysis: true,       // 2단계
  sectorComparison: false // 3단계 (토글 가능)
};

// StockProfile 컴포넌트에서
const shouldShowAIAnalysis = ENABLE_ENHANCED_FEATURES.aiAnalysis && aiData;
```

### 모니터링 & 분석
- [ ] 컴포넌트 로드 시간 추적
- [ ] API 응답 시간 모니터링
- [ ] 다양한 섹션과의 사용자 상호작용 추적
- [ ] 오류율 및 폴백 사용량 모니터링

## 📈 성공 지표 & 검증

### 기술적 성능
- [ ] 향상된 컴포넌트 로드 시간 < 3초 (새 데이터 소스 포함)
- [ ] 개선사항 실패 시 기존 프로필 로드 시간에 영향 없음
- [ ] 자주 조회하는 주식에 대한 SWR 캐시 적중률 > 80%
- [ ] 사용자 중단 없이 요율 제한 처리 작동
- [ ] 모바일 성능 유지 (라이트하우스 점수 > 85)

### 사용자 경험
- [ ] 가격 티커가 즉각적인 가치 제공 (실시간 느낌)
- [ ] AI 권장사항이 발견 가능하고 유용함
- [ ] 확장 가능한 섹션이 직관적으로 작동
- [ ] 오류 상태가 정보적이고 실행 가능함
- [ ] 컴포넌트가 모바일 기기에서 반응성 유지

### 데이터 품질 & 신뢰성
- [ ] 1-2분 이내 실시간 데이터 업데이트
- [ ] AI 분석이 실행 가능한 인사이트 제공
- [ ] 요율 제한 경고가 사용자의 제한 이해를 도움
- [ ] 데이터 소스 사용 불가 시 우아한 성능 저하
- [ ] 실시간 업데이트와 히스토리 데이터 일관성

### 통합 성공
- [ ] 기존 MainLayout 기능에 중단 없음
- [ ] 다른 컴포넌트 스타일링과 일관성
- [ ] 할당된 공간 내에 맞춤 (최대 높이 500px)
- [ ] 기존 StockProvider 상태 관리와 호환
- [ ] 기존 접근성 기능 유지

## 🔧 유지보수 & 향후 로드맵

### 즉시 모니터링 (첫 달)
- [ ] API 요율 제한 사용 패턴 모니터링
- [ ] 컴포넌트 렌더링 성능 추적
- [ ] 새 기능에 대한 사용자 피드백 수집
- [ ] 새 데이터 소스의 오류율 모니터링
- [ ] 모바일 사용성 개선 평가

### 단기 개선사항 (향후 2-3개월)
- [ ] 지표에 더 많은 기술적 지표 추가 (MACD, 볼린저 밴드)
- [ ] AI 분석용 캐싱 전략 구현
- [ ] 프로필 데이터용 내보내기 기능 추가 (CSV/PDF)
- [ ] 데이터 새로고침 비율에 대한 사용자 기본 설정 생성
- [ ] 빠른 작업용 키보드 단축키 추가

### 중기 기능 (향후 6개월)
- [ ] 히스토리 성과 차트 (미니 스파크라인)
- [ ] 추가 소스의 소셜 감정 통합
- [ ] 커스텀 피어 그룹과의 고급 비교
- [ ] 중요한 변화에 대한 알림 시스템
- [ ] 포트폴리오 추적과의 통합 (인증 추가 시)

### 아키텍처 진화
- [ ] 안정화 시 React Server Components로 이동 고려
- [ ] 대용량 데이터셋용 점진적 데이터 로딩 구현
- [ ] 가격 데이터용 실시간 WebSocket 업데이트 추가
- [ ] 금융 위젯용 컴포넌트 라이브러리 생성
- [ ] 기능 변형용 A/B 테스트 프레임워크 개발

## 📚 문서화 요구사항

### 개발자 문서화
- [ ] 컴포넌트 API 문서화
- [ ] 데이터 플로우 다이어그램
- [ ] 새 기능용 통합 가이드
- [ ] 성능 최적화 가이드라인

### 사용자 문서화
- [ ] 기능 설명 가이드
- [ ] 투자 용어 용어집
- [ ] AI 권장사항 사용 모범 사례
- [ ] 모바일 사용 가이드

## 🎯 구현 요약

이 향상된 주식 프로필 개발 가이드는 기존의 잘 작동하는 컴포넌트를 기반으로 구축하는 **실용적이고 점진적인 접근법**을 제공합니다. 전략은 다음을 우선시합니다:

### 🔑 주요 성공 요인

1. **보존 우선**: 개선사항을 추가하면서 모든 기존 기능 유지
2. **모듈형 성장**: 새 기능에 검증된 `FinancialExpandableSection` 패턴 사용
3. **데이터 통합**: 스마트 캐싱으로 기존 Supabase Edge Functions 활용
4. **디자인 일관성**: 확립된 CSS 변수 및 컴포넌트 패턴 따르기
5. **모바일 최적화**: 모든 개선사항이 반응형 제약 내에서 작동하도록 보장

### 🚀 예상 결과

**1단계 (1-2일)**: 실시간 가격 데이터가 즉시 사용자 참여 향상
**2단계 (2-3일)**: AI 인사이트가 실행 가능한 투자 가이드 제공
**3단계 (2-3일)**: 비교 기능이 시장 컨텍스트 추가
**4단계 (1-2일)**: 성능 최적화가 확장성 보장

### 📊 기술적 이점

- **점진적 개선**: 기존 기능에 대한 위험 없음
- **확립된 패턴**: 검증된 `FinancialExpandableSection` 아키텍처 사용
- **효율적인 데이터 페칭**: 적절한 새로고침 비율로 독립적인 SWR 캐시
- **우아한 성능 저하**: 향상된 데이터를 사용할 수 없어도 컴포넌트 작동
- **모바일 우선**: 기존 반응형 동작 유지

### 🔄 반복적 개발

이 가이드는 완전한 재구축을 시도하기보다는 **빠르게 출시하고 반복**하는 것을 강조합니다. 각 단계는 향후 개선의 기반을 설정하면서 즉각적인 가치를 제공합니다.

---

*이 가이드는 현재 코드베이스 아키텍처를 반영하며 새로운 기능이 구현되고 사용자 피드백이 수집됨에 따라 업데이트되어야 합니다. 기존 기능을 방해하지 않으면서 사용자 가치를 향상시키는 실용적이고 점진적인 개선에 중점을 두고 있습니다.*