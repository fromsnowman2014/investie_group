# Stock Profile 컴포넌트 개발 계획서

## 📋 개요

Stock Profile은 선택된 주식 종목에 대한 **핵심 프로필 정보를 4-5줄로 간결하게 요약**하여 제공하는 인포그래픽 컴포넌트입니다. Claude AI API를 활용하여 실시간으로 생성되며, 기존 컴포넌트들과 중복되지 않는 고유한 가치를 제공합니다.

### 🎯 목표
- **Input**: 현재 선택된 주식 종목/ticker (예: AAPL)
- **Output**: Claude AI API가 생성한 4-5줄의 핵심 프로필 요약
- **디자인**: 심플하면서도 직관적인 인포그래픽 형태로 시각화
- **차별점**: 기존 컴포넌트와 겹치지 않는 독자적인 통찰 제공

---

## 🔍 기존 컴포넌트 분석 및 차별화 전략

### 현재 존재하는 컴포넌트들

#### 1. **AIInvestmentOpinion** (AI 투자 의견)
- **제공 정보**: BUY/SELL/HOLD 추천, 신뢰도, 목표가, 투자 등급, 주요 포인트, 리스크, 기회
- **형태**: 상세한 투자 분석 리포트 (expandable)
- **특징**: 투자 의사결정을 위한 **전략적/미래지향적** 분석

#### 2. **StockProfile** (기존 주식 프로필 - 동일 이름!)
- **제공 정보**: 회사명, 섹터, 산업, 국가, 시가총액, P/E Ratio, 배당수익률, 직원 수, 설립연도, 본사, 웹사이트, 회사 설명
- **형태**: 기업 기본 정보 카드 (expandable)
- **특징**: 정적인 **기업 메타데이터** 중심

#### 3. **CompanyProfile** (TradingView 위젯)
- **제공 정보**: TradingView의 Company Profile 위젯
- **형태**: 임베디드 위젯
- **특징**: 외부 위젯 (TradingView)

#### 4. **MacroIndicatorsDashboard**
- **제공 정보**: Fear & Greed Index, VIX, S&P 500, 금리, CPI 등 **거시경제 지표**
- **특징**: 종목과 무관한 시장 전체 데이터

#### 5. **AINewsAnalysisReport**
- **제공 정보**: 종목 관련 최신 뉴스 및 AI 분석
- **특징**: **뉴스 기반** 단기 이슈 분석

### ⚠️ 문제점: 이름 충돌
현재 `StockProfile`이라는 이름의 컴포넌트가 이미 존재합니다. 새로운 컴포넌트는 **다른 이름**을 사용해야 합니다.

---

## 💡 새로운 컴포넌트 컨셉: **"AI Stock Snapshot"**

### 🏷️ 컴포넌트 이름
**`AIStockSnapshot`** (또는 `StockInsightCard`)

### 🎨 핵심 아이디어
기존 컴포넌트들이 놓치고 있는 영역을 채우는 **종합적이고 직관적인 한눈 요약**을 제공합니다.

### 📊 제공할 핵심 내용 (4-5줄)

AI가 다음 정보를 종합하여 **4-5개의 핵심 문장**으로 요약:

1. **현재 시장 위치** (Market Position)
   - 예: "AAPL은 글로벌 테크 업계 선두주자로 시가총액 3조 달러를 돌파하며 안정적인 성장세를 유지하고 있습니다."

2. **최근 퍼포먼스 요약** (Recent Performance)
   - 예: "지난 30일간 +12% 상승하며 S&P 500 대비 뛰어난 성과를 보였으며, 52주 최고가 근처에서 거래 중입니다."

3. **핵심 강점 또는 주요 동인** (Key Strength/Driver)
   - 예: "iPhone 15 시리즈의 강력한 판매와 서비스 부문의 지속적인 성장이 주가 상승의 핵심 동력입니다."

4. **현재 밸류에이션 상태** (Valuation Status)
   - 예: "현재 P/E Ratio 28배로 업종 평균 대비 소폭 프리미엄이지만, 브랜드 가치와 수익성을 고려하면 합리적 수준입니다."

5. **단기 주목 포인트** (Near-term Watch)
   - 예: "다음 주 실적 발표를 앞두고 시장의 관심이 집중되어 있으며, 가이던스가 주가 방향성을 결정할 전망입니다."

### 🚫 제외할 내용 (중복 방지)
- ❌ **BUY/SELL/HOLD 추천** → AIInvestmentOpinion이 담당
- ❌ **상세 기업 정보** (설립연도, 본사, 웹사이트) → StockProfile이 담당
- ❌ **매크로 경제 지표** → MacroIndicatorsDashboard가 담당
- ❌ **뉴스 기사 요약** → AINewsAnalysisReport가 담당

### ✅ 차별화 포인트
- **현재 시점의 종목 "상태"를 한눈에 파악**
- **투자 추천 없이 중립적인 팩트 기반 요약**
- **숫자와 트렌드를 자연스러운 문장으로 해석**
- **전문가가 주식을 5문장으로 소개한다면?**

---

## 🎨 디자인 컨셉: 심플한 인포그래픽

### UI 레이아웃 (1단 카드 형태)

```
┌─────────────────────────────────────────────────┐
│  📸 AI Stock Snapshot                      AAPL │
├─────────────────────────────────────────────────┤
│                                                 │
│  💼 [문장 1: 시장 위치]                         │
│  📈 [문장 2: 최근 퍼포먼스]                     │
│  🚀 [문장 3: 핵심 강점/동인]                    │
│  💰 [문장 4: 밸류에이션]                        │
│  👀 [문장 5: 단기 주목 포인트]                  │
│                                                 │
│  ────────────────────────────────────────────── │
│  🤖 AI-generated summary | Updated: 2 mins ago │
└─────────────────────────────────────────────────┘
```

### 시각적 특징
- **아이콘 + 문장** 조합으로 가독성 극대화
- **컴팩트한 높이** (200-250px 정도)
- **그라데이션 배경** (연한 블루 → 화이트)
- **각 문장은 1줄로 제한** (모바일 대응)

---

## 🔧 기술 구현 계획

### 1. Claude AI API 활용 (Anthropic)

#### 1.1 Vercel Edge Function 구현
```typescript
// apps/web/app/api/ai-stock-snapshot/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { symbol } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const snapshot = await generateStockSnapshot(symbol);
    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    console.error('AI Stock Snapshot Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate stock snapshot' },
      { status: 500 }
    );
  }
}

async function generateStockSnapshot(symbol: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildSnapshotPrompt(symbol);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = message.content[0].text;
  return parseSnapshot(content, symbol);
}

function buildSnapshotPrompt(symbol: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `
당신은 금융 애널리스트입니다. ${symbol} 주식에 대한 간결한 스냅샷을 작성해주세요.

## 요구사항
- **정확히 5개의 문장**으로 작성
- 각 문장은 **40-60자 이내**로 제한
- 투자 추천(BUY/SELL/HOLD) **제외** - 팩트만 전달
- 최신 데이터(${today} 기준) 사용

## 포함 내용
1. 현재 시장 위치 (시가총액, 업계 지위)
2. 최근 30일 퍼포먼스 요약 (주가 변동, 벤치마크 대비)
3. 핵심 성장 동력 또는 주요 강점
4. 밸류에이션 상태 (P/E, PEG 등)
5. 단기 주목 포인트 (어닝, 이벤트 등)

## 출력 형식
각 문장을 한 줄씩 번호 없이 출력:
[문장 1]
[문장 2]
[문장 3]
[문장 4]
[문장 5]
`;
}

function parseSnapshot(content: string, symbol: string) {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // 최대 5개 문장만 사용
  const sentences = lines.slice(0, 5);

  return {
    symbol,
    sentences,
    timestamp: new Date().toISOString()
  };
}
```

### 2. Frontend 컴포넌트 구현

```tsx
// apps/web/src/app/components/AIAnalysis/AIStockSnapshot.tsx
'use client';

import React from 'react';
import useSWR from 'swr';
import { edgeFunctionFetcher } from '@/lib/api-utils';

interface AIStockSnapshotProps {
  symbol: string;
}

interface SnapshotData {
  symbol: string;
  sentences: string[];
  timestamp: string;
}

const SENTENCE_ICONS = ['💼', '📈', '🚀', '💰', '👀'];

export default function AIStockSnapshot({ symbol }: AIStockSnapshotProps) {
  const { data, error, isLoading } = useSWR<SnapshotData>(
    symbol ? `ai-snapshot-${symbol}` : null,
    async () => {
      const response = await fetch('/api/ai-stock-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });

      if (!response.ok) throw new Error('Failed to fetch snapshot');

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
      <div className="ai-stock-snapshot skeleton">
        <div className="snapshot-header">
          <span className="snapshot-title">📸 AI Stock Snapshot</span>
          <span className="snapshot-symbol">{symbol}</span>
        </div>
        <div className="snapshot-content">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-line"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.sentences) {
    return (
      <div className="ai-stock-snapshot error">
        <div className="snapshot-header">
          <span className="snapshot-title">📸 AI Stock Snapshot</span>
        </div>
        <div className="error-message">
          ⚠️ 스냅샷을 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const timeAgo = getTimeAgo(data.timestamp);

  return (
    <div className="ai-stock-snapshot">
      {/* Header */}
      <div className="snapshot-header">
        <span className="snapshot-title">📸 AI Stock Snapshot</span>
        <span className="snapshot-symbol">{symbol}</span>
      </div>

      {/* Content - 5 sentences with icons */}
      <div className="snapshot-content">
        {data.sentences.map((sentence, index) => (
          <div key={index} className="snapshot-item">
            <span className="snapshot-icon">{SENTENCE_ICONS[index]}</span>
            <span className="snapshot-text">{sentence}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="snapshot-footer">
        <span className="ai-badge">🤖 AI-generated summary</span>
        <span className="timestamp">Updated: {timeAgo}</span>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
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
}
```

### 3. 스타일링 (간소화된 CSS)

```css
/* apps/web/src/app/styles/ai-stock-snapshot.css */
.ai-stock-snapshot {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0f2fe;
  max-width: 100%;
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #bfdbfe;
}

.snapshot-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.snapshot-symbol {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 6px;
}

.snapshot-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.snapshot-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}

.snapshot-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
}

.snapshot-text {
  font-size: 14px;
  color: #1f2937;
  flex: 1;
}

.snapshot-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 11px;
  color: #6b7280;
}

.ai-badge {
  font-weight: 500;
}

.timestamp {
  font-style: italic;
}

/* Loading State */
.ai-stock-snapshot.skeleton .skeleton-line {
  height: 20px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Error State */
.ai-stock-snapshot.error .error-message {
  text-align: center;
  color: #ef4444;
  padding: 20px;
  font-size: 14px;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .snapshot-text {
    font-size: 13px;
  }

  .snapshot-icon {
    font-size: 16px;
    width: 20px;
  }
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
AIStockSnapshot 컴포넌트 렌더링
         ↓
SWR: /api/ai-stock-snapshot POST {symbol: "AAPL"}
         ↓
Vercel Edge Function
         ↓
Claude AI API 호출 (프롬프트 전송)
         ↓
Claude가 최신 데이터 기반 5문장 생성
         ↓
응답 파싱 및 반환
         ↓
SWR 캐싱 (30분)
         ↓
UI 렌더링 (아이콘 + 문장)
```

---

## 🚀 구현 우선순위

### Phase 1: 핵심 기능 (즉시 구현)
- [x] Vercel Edge Function (`/api/ai-stock-snapshot`)
- [x] Claude AI API 통합
- [x] 프롬프트 엔지니어링 (5문장 제약)
- [x] Frontend 컴포넌트 (`AIStockSnapshot.tsx`)
- [x] 기본 스타일링

### Phase 2: UX 개선
- [ ] 로딩 스켈레톤 애니메이션
- [ ] 에러 핸들링 및 재시도 버튼
- [ ] 타임스탬프 표시 개선
- [ ] 다크모드 지원

### Phase 3: 고도화
- [ ] 사용자 피드백 수집 (👍/👎)
- [ ] 프롬프트 A/B 테스트
- [ ] 캐시 전략 최적화
- [ ] 다국어 지원 (영어/한국어 토글)

---

## 🎯 성공 지표

1. **간결성**: 5문장 이내로 핵심 정보 전달
2. **차별성**: 기존 컴포넌트와 0% 중복
3. **가독성**: 평균 10초 이내 읽기 완료
4. **정확성**: AI 생성 정보의 팩트 체크 통과율 95%+
5. **성능**: 응답 시간 3초 이내, 캐시 히트율 80%+

---

## 📝 추가 고려사항

### API 비용 최적화
- **캐싱**: 30분 TTL로 동일 심볼 중복 호출 방지
- **토큰 제한**: max_tokens=500으로 비용 통제
- **Rate Limiting**: 사용자당 분당 3회 제한

### 에러 처리
- API 실패 시 fallback 메시지 표시
- 재시도 로직 (최대 2회)
- Sentry 로깅으로 에러 모니터링

### 품질 관리
- 프롬프트 버전 관리 (Git)
- 주기적인 출력 샘플 검토
- 사용자 피드백 수집 및 반영

---

## ✅ 결론

**AIStockSnapshot** 컴포넌트는 기존의 상세한 분석 컴포넌트들 사이에서 **"한눈에 보는 종목 상태"**라는 독자적인 가치를 제공합니다.

- **AIInvestmentOpinion**: "투자해야 할까?" → 전략
- **StockProfile**: "이 회사는 누구인가?" → 정보
- **AIStockSnapshot**: "지금 이 종목은 어떤 상태인가?" → **현황 요약**

심플한 디자인과 AI의 자연어 생성 능력을 결합하여, 사용자가 가장 먼저 읽고 싶어하는 **핵심 스냅샷**을 제공하는 것이 목표입니다.
