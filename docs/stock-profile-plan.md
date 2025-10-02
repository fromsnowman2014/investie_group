# Stock Profile 컴포넌트 AI 개선 계획서

## 📋 개요

현재 **StockProfile** 컴포넌트는 정적인 기업 메타데이터(회사명, 섹터, 시가총액, P/E, 배당률, 직원 수 등)를 표시하는 정보성 컴포넌트입니다. 이를 **Claude AI API**를 활용하여 **AIInvestmentOpinion**처럼 **AI가 생성한 기업 분석 요약**을 제공하는 컴포넌트로 개선합니다.

### 🎯 개선 목표
- **현재 상태**: 정적 데이터 나열 (API에서 받은 기업 정보 그대로 표시)
- **개선 후**: Claude AI가 생성한 **4-5줄의 간결한 기업 분석 요약** 제공
- **유지 사항**: 기존 API 엔드포인트(`/api/v1/dashboard/${symbol}/profile`)는 그대로 사용하되, AI 요약 추가
- **참고 모델**: AIInvestmentOpinion의 구조와 스타일 적용

---

## 🔍 현재 StockProfile 컴포넌트 분석

### 현재 구조
```tsx
StockProfile.tsx (167줄)
├── Header: 회사명, 심볼, 섹터/산업/국가 태그
├── Key Metrics: 시가총액, P/E Ratio, 배당수익률
└── FinancialExpandableSection (접을 수 있는 영역)
    ├── Company Description (긴 텍스트)
    └── Company Details: 직원 수, 설립연도, 본사, 웹사이트
```

### 제공 중인 데이터
```typescript
interface StockProfileData {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  description: string;        // ← 이 부분이 너무 길고 정적임
  employees: number;
  founded: string;
  headquarters: string;
  website: string;
}
```

### 문제점
1. **`description` 필드**가 매우 길고 (100-300자), 읽기 어려움
2. **정적인 정보**만 나열 (Wikipedia 스타일)
3. **투자 관점의 인사이트 부족** - 단순 회사 소개에 그침
4. **다른 컴포넌트와 차별성 부족**

---

## 💡 개선 컨셉: AI 기업 분석 요약 추가

### 🎨 핵심 아이디어

기존의 정적인 `description` 대신, **Claude AI가 생성한 4-5줄의 기업 분석 요약**을 보여줍니다.

#### 제공할 핵심 내용 (4-5줄)

1. **기업 핵심 가치 제안** (Value Proposition)
   - 예: "Apple은 혁신적인 하드웨어와 소프트웨어 생태계를 통해 프리미엄 소비자 시장을 지배하는 기업입니다."

2. **비즈니스 모델 및 수익원** (Business Model)
   - 예: "iPhone, Mac, iPad 등 하드웨어 판매가 주 수익원이며, App Store, iCloud 등 서비스 부문이 빠르게 성장 중입니다."

3. **경쟁 우위 및 차별성** (Competitive Advantage)
   - 예: "폐쇄형 생태계와 강력한 브랜드 충성도를 바탕으로 업계 최고 수준의 마진율을 유지하고 있습니다."

4. **주요 리스크 및 기회** (Key Risks & Opportunities)
   - 예: "중국 시장 의존도가 높아 지정학적 리스크가 존재하나, AI 및 웨어러블 시장 확대가 새로운 성장 동력입니다."

5. **재무 건전성 한 줄 요약** (Financial Health)
   - 예: "막대한 현금 보유(1900억 달러)와 안정적인 현금 흐름으로 배당과 자사주 매입을 지속하고 있습니다."

### 🚫 제외할 내용 (중복 방지)
- ❌ **투자 추천** (BUY/SELL/HOLD) → AIInvestmentOpinion이 담당
- ❌ **주가 분석, 목표가** → AIInvestmentOpinion이 담당
- ❌ **최신 뉴스** → AINewsAnalysisReport가 담당
- ❌ **매크로 지표** → MacroIndicatorsDashboard가 담당

### ✅ 차별화 포인트
- **"이 회사는 무엇을 하고, 어떻게 돈을 버는가?"**에 집중
- **비즈니스 관점의 분석** (주가가 아닌 회사 자체)
- **투자자가 알아야 할 기업 본질** 요약

---

## 🎨 개선된 UI 디자인

### Before (현재)
```
┌─────────────────────────────────────┐
│ Apple Inc.                     AAPL │
│ Technology | Consumer Electronics   │
├─────────────────────────────────────┤
│ Market Cap: $3.2T                   │
│ P/E Ratio: 28.5                     │
│ Dividend Yield: 0.5%                │
├─────────────────────────────────────┤
│ [Company Information ▼]             │
│ About Apple Inc.                    │
│ Apple Inc. designs, manufactures,   │
│ and markets smartphones, personal   │
│ computers, tablets, wearables...    │
│ (매우 긴 텍스트가 계속됨)            │
│                                     │
│ Employees: 161K                     │
│ Founded: 1976                       │
│ Headquarters: Cupertino, CA         │
└─────────────────────────────────────┘
```

### After (개선)
```
┌─────────────────────────────────────┐
│ Apple Inc.                     AAPL │
│ Technology | Consumer Electronics   │
├─────────────────────────────────────┤
│ Market Cap: $3.2T                   │
│ P/E Ratio: 28.5                     │
│ Dividend Yield: 0.5%                │
├─────────────────────────────────────┤
│ 🤖 AI Company Analysis              │
│                                     │
│ 🏢 Apple은 혁신적인 하드웨어와      │
│    소프트웨어 생태계로 프리미엄     │
│    소비자 시장을 지배합니다.        │
│                                     │
│ 💰 iPhone 판매가 주 수익원이며      │
│    서비스 부문이 빠르게 성장 중     │
│                                     │
│ 🎯 폐쇄형 생태계와 브랜드 충성도가  │
│    핵심 경쟁 우위입니다.            │
│                                     │
│ ⚠️ 중국 시장 의존도가 리스크이나    │
│    AI·웨어러블이 새 성장 동력       │
│                                     │
│ 💵 1900억 달러 현금 보유로 배당     │
│    및 자사주 매입 지속 가능         │
│                                     │
│ Updated: 5 mins ago                 │
├─────────────────────────────────────┤
│ [Company Details ▼]                 │
│ Employees: 161K                     │
│ Founded: 1976                       │
│ Headquarters: Cupertino, CA         │
│ Website: apple.com                  │
└─────────────────────────────────────┘
```

---

## 🔧 기술 구현 계획

### 1. Backend: Vercel Edge Function

#### 1.1 새로운 API 엔드포인트
```typescript
// apps/web/app/api/ai-company-analysis/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { symbol, companyData } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const analysis = await generateCompanyAnalysis(symbol, companyData);
    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('AI Company Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate company analysis' },
      { status: 500 }
    );
  }
}

async function generateCompanyAnalysis(symbol: string, companyData?: any) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildCompanyAnalysisPrompt(symbol, companyData);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 600,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;
  return parseCompanyAnalysis(content, symbol);
}

function buildCompanyAnalysisPrompt(symbol: string, companyData?: any): string {
  const today = new Date().toISOString().split('T')[0];

  // companyData가 있으면 컨텍스트로 활용
  const contextSection = companyData ? `
## 기업 기본 정보 (참고용)
- 회사명: ${companyData.companyName}
- 섹터: ${companyData.sector}
- 산업: ${companyData.industry}
- 시가총액: ${companyData.marketCap}
- 직원 수: ${companyData.employees}
` : '';

  return `
당신은 기업 분석 전문가입니다. ${symbol} 기업에 대한 간결한 비즈니스 분석을 작성해주세요.

${contextSection}

## 요구사항
- **정확히 5개의 문장**으로 작성
- 각 문장은 **50-80자 이내**로 제한
- **투자 추천 없이** 기업의 비즈니스 본질만 분석
- 최신 정보(${today} 기준) 반영

## 포함 내용 (순서대로)
1. **기업 핵심 가치 제안**: 이 회사는 무엇을 하는가?
2. **비즈니스 모델**: 어떻게 수익을 창출하는가?
3. **경쟁 우위**: 경쟁사 대비 어떤 강점이 있는가?
4. **주요 리스크 및 기회**: 어떤 위험과 기회가 있는가?
5. **재무 건전성**: 재무 상태는 어떠한가?

## 출력 형식
각 문장을 한 줄씩 번호 없이 출력:
[문장 1]
[문장 2]
[문장 3]
[문장 4]
[문장 5]

## 주의사항
- BUY/SELL/HOLD 같은 투자 추천 **금지**
- 주가 전망, 목표가 언급 **금지**
- 팩트 중심의 비즈니스 분석만 제공
`;
}

function parseCompanyAnalysis(content: string, symbol: string) {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // 최대 5개 문장만 사용
  const sentences = lines.slice(0, 5);

  return {
    symbol,
    analysis: sentences,
    timestamp: new Date().toISOString()
  };
}
```

### 2. Frontend: StockProfile 컴포넌트 개선

```tsx
// apps/web/src/app/components/AIAnalysis/StockProfile.tsx
'use client';

import React from 'react';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api-utils';
import FinancialExpandableSection from '../FinancialExpandableSection';

interface StockProfileData {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  description: string;
  employees: number;
  founded: string;
  headquarters: string;
  website: string;
}

interface AICompanyAnalysis {
  symbol: string;
  analysis: string[];  // 5개 문장
  timestamp: string;
}

interface StockProfileProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  const response = await apiFetch(url);
  const data = await response.json();
  return data;
};

const ANALYSIS_ICONS = ['🏢', '💰', '🎯', '⚠️', '💵'];

export default function StockProfile({ symbol }: StockProfileProps) {
  // 기존 프로필 데이터
  const { data, error, isLoading } = useSWR<StockProfileData>(
    symbol ? `/api/v1/dashboard/${symbol}/profile` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  // AI 분석 데이터
  const {
    data: aiAnalysis,
    error: aiError,
    isLoading: aiLoading
  } = useSWR<AICompanyAnalysis>(
    symbol && data ? `ai-company-${symbol}` : null,
    async () => {
      const response = await fetch('/api/ai-company-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          companyData: data  // 기존 데이터를 컨텍스트로 제공
        })
      });

      if (!response.ok) throw new Error('Failed to fetch AI analysis');

      const result = await response.json();
      return result.data;
    },
    {
      refreshInterval: 30 * 60 * 1000, // 30분마다 갱신
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
    }
  );

  if (isLoading) {
    return (
      <div className="stock-profile-loading">
        <div className="skeleton-card">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
          <div className="skeleton-metrics">
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load stock profile</h3>
        <p>Please check the symbol and try again</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stock-profile-empty">
        <div className="empty-icon">📊</div>
        <p>Select a stock symbol to view profile</p>
      </div>
    );
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="stock-profile">
      {/* Company Header */}
      <div className="profile-header data-density-high">
        <div className="company-info mb-2">
          <h1 className="financial-title text-lg">{data.companyName}</h1>
          <div className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
            {data.symbol}
          </div>
        </div>
        <div className="company-meta flex flex-wrap gap-2">
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.sector}</span>
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.industry}</span>
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.country}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics space-y-1">
        <div className="data-row">
          <span className="data-label">Market Cap</span>
          <span className="data-value financial-data">{formatMarketCap(data.marketCap)}</span>
        </div>
        <div className="data-row">
          <span className="data-label">P/E Ratio</span>
          <span className="data-value financial-data">{data.peRatio?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Dividend Yield</span>
          <span className="data-value financial-data">
            {data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A'}
          </span>
        </div>
      </div>

      {/* AI Company Analysis - NEW! */}
      <div className="ai-company-analysis mt-4 p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="financial-title text-sm font-semibold text-blue-900">
            🤖 AI Company Analysis
          </h4>
          {aiAnalysis && (
            <span className="text-xs text-gray-500">
              {getTimeAgo(aiAnalysis.timestamp)}
            </span>
          )}
        </div>

        {aiLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        )}

        {aiError && (
          <p className="text-sm text-red-600">
            ⚠️ AI 분석을 불러올 수 없습니다.
          </p>
        )}

        {aiAnalysis && !aiLoading && (
          <div className="space-y-2">
            {aiAnalysis.analysis.map((sentence, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">
                  {ANALYSIS_ICONS[index]}
                </span>
                <p className="supporting-text text-sm leading-relaxed text-gray-800">
                  {sentence}
                </p>
              </div>
            ))}
          </div>
        )}

        {!aiAnalysis && !aiLoading && !aiError && (
          <p className="text-sm text-gray-500">AI 분석 생성 중...</p>
        )}
      </div>

      {/* Company Details - Using FinancialExpandableSection */}
      <FinancialExpandableSection
        title="Company Details"
        dataType="profile"
        priority="supplementary"
        initialHeight={{
          mobile: 80,
          tablet: 100,
          desktop: 120
        }}
        className="mt-4"
      >
        <div className="company-details space-y-1">
          <div className="data-row">
            <span className="data-label">Employees</span>
            <span className="data-value financial-data">{formatNumber(data.employees)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Founded</span>
            <span className="data-value financial-data">{data.founded}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Headquarters</span>
            <span className="data-value financial-data">{data.headquarters}</span>
          </div>
          {data.website && (
            <div className="data-row">
              <span className="data-label">Website</span>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="data-value financial-data text-blue-600 hover:text-blue-700 transition-colors"
              >
                {data.website.replace('https://', '').replace('http://', '')}
              </a>
            </div>
          )}
        </div>
      </FinancialExpandableSection>
    </div>
  );
}
```

---

## 🔐 환경 변수 설정

```bash
# apps/web/.env.local
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## 📊 데이터 플로우

```
사용자 종목 선택 (AAPL)
         ↓
StockProfile 컴포넌트 렌더링
         ↓
1. 기존 API 호출: /api/v1/dashboard/AAPL/profile
   → 기본 기업 정보 로드 (시가총액, P/E 등)
         ↓
2. AI API 호출: /api/ai-company-analysis
   POST { symbol: "AAPL", companyData: {...} }
         ↓
Vercel Edge Function
         ↓
Claude AI API 호출
         ↓
Claude가 5개 문장 기업 분석 생성
         ↓
응답 파싱 및 반환
         ↓
SWR 캐싱 (30분)
         ↓
UI 렌더링 (아이콘 + 분석 문장)
```

---

## 🚀 구현 우선순위

### Phase 1: 핵심 기능 (즉시 구현 가능)
- [ ] Vercel Edge Function 생성 (`/api/ai-company-analysis`)
- [ ] Claude AI API 통합
- [ ] 프롬프트 엔지니어링 (기업 분석 5문장)
- [ ] StockProfile 컴포넌트 수정 (AI 섹션 추가)
- [ ] 기본 스타일링 (그라데이션 배경)

### Phase 2: UX 개선
- [ ] 로딩 스켈레톤 애니메이션
- [ ] 에러 핸들링 개선
- [ ] 타임스탬프 포맷팅
- [ ] 모바일 반응형 최적화

### Phase 3: 고도화
- [ ] AI 분석 품질 모니터링
- [ ] 프롬프트 A/B 테스트
- [ ] 사용자 피드백 수집 (👍/👎)
- [ ] 캐시 전략 최적화

---

## 🎯 성공 지표

1. **간결성**: 5문장 이내로 기업 본질 전달
2. **정확성**: 팩트 기반 분석 (추천 없음)
3. **차별성**: AIInvestmentOpinion과 명확히 구분
4. **가독성**: 평균 15초 이내 읽기 완료
5. **성능**: AI 응답 시간 3초 이내, 캐시 히트율 80%+

---

## 📝 추가 고려사항

### API 비용 최적화
- **캐싱**: 30분 TTL로 중복 호출 방지
- **토큰 제한**: max_tokens=600으로 비용 통제
- **조건부 호출**: 기존 프로필 데이터가 로드된 후에만 AI 호출

### 에러 처리
- AI API 실패 시 기존 `description` 필드로 폴백
- 재시도 로직 (최대 2회)
- 에러 로깅 (Sentry 등)

### 품질 관리
- 프롬프트 버전 관리 (Git)
- 주기적인 AI 출력 샘플 검토
- 부적절한 내용 필터링

---

## ✅ 결론

### Before vs After 비교

| 항목 | Before (현재) | After (개선) |
|------|--------------|-------------|
| **내용** | 정적인 회사 소개 (Wikipedia 스타일) | AI 생성 기업 분석 (비즈니스 관점) |
| **길이** | 100-300자 (너무 김) | 5문장 (250-400자) |
| **가독성** | 낮음 (긴 텍스트 블록) | 높음 (아이콘 + 짧은 문장) |
| **인사이트** | 없음 (정보 나열) | 있음 (가치 제안, 리스크/기회) |
| **업데이트** | 거의 없음 (정적) | 30분마다 (AI 생성) |
| **차별성** | CompanyProfile 위젯과 중복 | 독자적인 비즈니스 분석 |

### 기대 효과
1. **사용자 경험 개선**: 긴 텍스트 읽기 부담 감소
2. **정보 가치 향상**: 단순 정보 → 분석/인사이트
3. **컴포넌트 차별화**: AIInvestmentOpinion과 명확히 구분
4. **브랜드 일관성**: AI 기반 분석 컴포넌트로 통일

### 핵심 철학
- **AIInvestmentOpinion**: "**투자해야 할까?**" (미래 전망)
- **StockProfile (개선)**: "**이 회사는 무엇을 하는가?**" (비즈니스 본질)

기존의 정적인 정보 나열에서 벗어나, **AI가 해석한 기업의 본질**을 제공하는 컴포넌트로 진화합니다.
