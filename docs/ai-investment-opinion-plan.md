# AI Investment Opinion 구현 계획 (간소화 버전)

## 📋 개요

AI Investment Opinion은 선택된 주식 종목에 대해 Google AI API (Gemini)를 활용하여 10줄 이내의 가독성 있는 투자 의견을 제공하는 간단한 기능입니다.

### 🎯 목표
- **Input**: 현재 선택된 주식 종목/ticker (예: AAPL)
- **Output**: Google AI API를 활용한 종합 투자 의견 (10줄 이내)
- **접근법**: 복잡한 데이터 수집 없이 프롬프트 기반 AI 분석

## 🏗️ 간소화된 시스템 아키텍처

### 핵심 컨셉
기존의 복잡한 데이터 수집 및 통합 방식 대신, **Google AI API에게 필요한 모든 정보를 포함하는 종합적인 프롬프트를 제공**하여 AI가 직접 최신 정보를 바탕으로 분석하도록 하는 방식입니다.

### 장점
- ✅ **구현 복잡도 대폭 감소**: 별도 데이터 수집 API 불필요
- ✅ **실시간 정보**: AI가 최신 시장 정보에 접근 가능
- ✅ **유지보수 간편**: 단일 API 호출로 완결
- ✅ **빠른 개발**: 기존 인프라 의존성 최소화

## 🔧 구현 계획

### 단일 API 호출 방식

#### 1.1 Google AI API Service 구현
```typescript
// apps/backend/src/ai/google-ai.service.ts
@Injectable()
export class GoogleAIService {
  private readonly logger = new Logger(GoogleAIService.name);
  private readonly apiKey = process.env.GOOGLE_AI_API_KEY;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generateInvestmentOpinion(symbol: string): Promise<InvestmentOpinionResponse> {
    const prompt = this.buildComprehensivePrompt(symbol);
    
    const response = await axios.post(
      `${this.baseUrl}/models/gemini-pro:generateContent`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,  // 일관성 있는 분석을 위해 낮은 temperature
          maxOutputTokens: 500,  // 10줄 제한을 위한 토큰 제한
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        }
      }
    );

    return this.parseResponse(response.data);
  }

  private buildComprehensivePrompt(symbol: string): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `
당신은 전문 투자 분석가입니다. ${symbol} 주식에 대한 종합적인 투자 의견을 제공해주세요.

## 분석 요청 (${currentDate} 기준)

다음 정보들을 최신 데이터를 바탕으로 종합 분석하여 투자 의견을 제시해주세요:

### 🧭 매크로(시장 전반) 정보 분석
- CNN Fear & Greed Index 현재 수치 및 상태
- VIX (변동성 지수) 현재 수치 및 의미
- 미국 기준금리 현재 수준 및 전망
- 미국 CPI (소비자물가지수) 최신 수치 및 트렌드
- 미국 실업률 최신 수치 및 고용시장 상황
- S&P500 현재 수준 및 최근 움직임
- M2 머니서플라이, 역레포 등 미국 유동성 트렌드

### 🔬 마이크로(개별 종목) 정보 분석 - ${symbol}
- PER (주가수익비율) 현재 수준 및 업종 대비 평가
- EPS (주당순이익) 최근 실적 및 성장률
- RSI (상대강도지수) 현재 수준 및 기술적 분석
- 이번주 또는 최근 핵심 뉴스 및 이슈
- 가장 최근 어닝(실적) 발표 결과 분석
- 실적 발표 예정일 (있을 경우)
- 배당금액 최근 트렌드 (증가/감소/유지)
- 회사의 향후 가이던스 (긍정적/부정적 전망)
- 애널리스트 평균 목표가 및 현재가 대비 업사이드/다운사이드

## 📋 출력 요구사항
1. **정확히 10줄 이내**로 작성
2. 각 줄은 **명확하고 간결**하게 작성
3. **BUY/HOLD/SELL** 중 명확한 추천 포함
4. **주요 리스크와 기회요인** 언급
5. **투자 시간 프레임** 제시 (단기/중기/장기)
6. **신뢰도 점수** (1-100) 제시
7. 매크로와 마이크로 요인을 **균형있게 반영**

## 💡 투자 의견 (10줄 이내):
`;
  }

  private parseResponse(responseData: any): InvestmentOpinionResponse {
    try {
      const content = responseData.candidates[0].content.parts[0].text;
      
      // 추천 등급 추출
      const recommendation = this.extractRecommendation(content);
      
      // 신뢰도 추출
      const confidence = this.extractConfidence(content);
      
      // 핵심 요인 추출
      const keyFactors = this.extractKeyFactors(content);
      
      return {
        success: true,
        content: content.trim(),
        recommendation,
        confidence,
        keyFactors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to parse Google AI response:', error);
      throw new Error('Invalid response format from Google AI');
    }
  }

  private extractRecommendation(content: string): 'BUY' | 'HOLD' | 'SELL' {
    const upperContent = content.toUpperCase();
    if (upperContent.includes('BUY')) return 'BUY';
    if (upperContent.includes('SELL')) return 'SELL';
    return 'HOLD';
  }

  private extractConfidence(content: string): number {
    const confidenceMatch = content.match(/신뢰도[:\s]*(\d+)/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
  }

  private extractKeyFactors(content: string): string[] {
    // 간단한 키워드 추출 로직
    const factors = [];
    if (content.includes('실적')) factors.push('실적 관련');
    if (content.includes('금리')) factors.push('금리 환경');
    if (content.includes('성장')) factors.push('성장성');
    return factors.length > 0 ? factors : ['종합 분석'];
  }
}
```

#### 1.2 간소화된 투자 의견 서비스
```typescript
// apps/backend/src/ai/investment-opinion.service.ts
@Injectable()
export class InvestmentOpinionService {
  constructor(
    private readonly googleAIService: GoogleAIService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async generateInvestmentOpinion(symbol: string): Promise<InvestmentOpinionResult> {
    try {
      // 캐시 확인
      const cacheKey = `ai-opinion:${symbol}`;
      const cached = await this.cacheManager.get<InvestmentOpinionResult>(cacheKey);
      
      if (cached) {
        this.logger.log(`Using cached opinion for ${symbol}`);
        return cached;
      }

      // Google AI API 호출
      const opinion = await this.googleAIService.generateInvestmentOpinion(symbol);
      
      const result: InvestmentOpinionResult = {
        success: true,
        symbol,
        opinion: opinion.content,
        recommendation: opinion.recommendation,
        confidence: opinion.confidence,
        keyFactors: opinion.keyFactors,
        lastUpdated: new Date().toISOString(),
        source: 'google_ai_gemini'
      };

      // 30분 캐싱
      await this.cacheManager.set(cacheKey, result, 30 * 60 * 1000);
      
      return result;
    } catch (error) {
      this.logger.error(`Investment opinion generation failed for ${symbol}:`, error);
      return this.getFallbackOpinion(symbol);
    }
  }

  private getFallbackOpinion(symbol: string): InvestmentOpinionResult {
    return {
      success: false,
      symbol,
      opinion: `${symbol}에 대한 AI 분석을 일시적으로 제공할 수 없습니다. Google AI API 연결을 확인해주세요.`,
      recommendation: 'HOLD',
      confidence: 0,
      keyFactors: ['API 오류'],
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
      error: 'Google AI API 호출 실패'
    };
  }
}
```

### API 엔드포인트 및 프론트엔드 구현

#### Backend API Controller
```typescript
// apps/backend/src/ai/ai-opinion.controller.ts
@Controller('api/v1/ai-opinion')
export class AIOpinionController {
  constructor(
    private readonly investmentOpinionService: InvestmentOpinionService
  ) {}

  @Get(':symbol')
  async getInvestmentOpinion(@Param('symbol') symbol: string) {
    try {
      const result = await this.investmentOpinionService.generateInvestmentOpinion(symbol);
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to generate investment opinion',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':symbol/refresh')
  async refreshOpinion(@Param('symbol') symbol: string) {
    // 캐시를 무시하고 새로운 분석 생성
    const cacheKey = `ai-opinion:${symbol}`;
    await this.cacheManager.del(cacheKey);
    return this.getInvestmentOpinion(symbol);
  }
}
```

#### Frontend Component (간소화된 버전)
```tsx
// apps/web/src/app/components/AIInvestmentOpinion/AIOpinionCard.tsx
'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchAIOpinion } from '@/lib/api-utils';

interface AIOpinionCardProps {
  symbol: string;
  className?: string;
}

export const AIOpinionCard: React.FC<AIOpinionCardProps> = ({ 
  symbol, 
  className = '' 
}) => {
  const { data, error, isLoading, mutate } = useSWR(
    symbol ? `ai-opinion-${symbol}` : null,
    () => fetchAIOpinion(symbol),
    {
      refreshInterval: 30 * 60 * 1000, // 30분마다 갱신
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // 10분간 중복 요청 방지
    }
  );

  if (isLoading) {
    return <AIOpinionSkeleton />;
  }

  if (error) {
    return <AIOpinionError onRetry={() => mutate()} />;
  }

  if (!data?.success) {
    return <AIOpinionError message={data?.error} onRetry={() => mutate()} />;
  }

  const opinion = data.data;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Investment Opinion
            </h3>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
        </div>
        
        {/* Recommendation Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          opinion.recommendation === 'BUY' 
            ? 'bg-green-100 text-green-800'
            : opinion.recommendation === 'SELL'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {opinion.recommendation}
        </div>
      </div>

      {/* Opinion Content */}
      <div className="space-y-3 mb-4">
        {opinion.opinion.split('\n').filter(line => line.trim()).map((line, index) => (
          <p key={index} className="text-gray-700 text-sm leading-relaxed">
            {line.trim()}
          </p>
        ))}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>신뢰도: {opinion.confidence}%</span>
          <span>기간: {opinion.timeframe}</span>
        </div>
        
        <button
          onClick={() => mutate()}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          새로고침
        </button>
      </div>

      {/* Key Factors (Collapsible) */}
      <details className="mt-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
          주요 분석 요인 보기
        </summary>
        <div className="mt-2 space-y-2">
          {opinion.keyFactors?.map((factor, index) => (
            <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
```

## 🔧 환경 변수 설정

```bash
# .env 파일에 추가 (단일 API 키만 필요)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here
```

## 📊 간소화된 데이터 플로우

```
1. 사용자가 종목 선택 (예: AAPL)
   ↓
2. InvestmentOpinionService.generateInvestmentOpinion(AAPL)
   ↓
3. 캐시 확인 (30분 TTL)
   ↓
4. Google AI API에 종합 프롬프트 전송
   - 매크로 + 마이크로 정보 요청을 포함한 단일 프롬프트
   ↓
5. Google AI가 최신 데이터를 바탕으로 10줄 이내 분석 생성
   ↓
6. 결과 파싱 및 캐싱
   ↓
7. AIOpinionCard 컴포넌트에서 렌더링
```

## 🚀 간소화된 구현 우선순위

### 1단계 (핵심 기능 - 즉시 구현 가능)
- [ ] Google AI API Service 구현
- [ ] 종합 프롬프트 작성
- [ ] 기본 투자 의견 생성 로직
- [ ] 프론트엔드 컴포넌트
- [ ] 캐싱 시스템

### 2단계 (개선 사항)
- [ ] 프롬프트 최적화
- [ ] 에러 핸들링 강화
- [ ] 응답 파싱 로직 개선
- [ ] 사용자 피드백 수집

### 3단계 (고도화)
- [ ] 프롬프트 A/B 테스트
- [ ] 다국어 지원
- [ ] 사용자 맞춤형 분석
- [ ] 성능 모니터링 대시보드

## 🔍 성능 및 비용 최적화

### 캐싱 전략 (간소화)
```typescript
const CACHE_DURATION = 30 * 60 * 1000; // 30분 (단일 캐시 정책)
```

### API 호출 최적화
- 30분 캐싱으로 API 호출 최소화
- Rate limiting 및 retry 로직 구현
- 프롬프트 길이 최적화로 비용 절감

## 🧪 간소화된 테스트 계획

### 1. 핵심 테스트
- Google AI API 연결 테스트
- 프롬프트 응답 품질 테스트
- 캐싱 동작 테스트

### 2. 통합 테스트
- 전체 플로우 테스트
- API 엔드포인트 테스트
- 프론트엔드 렌더링 테스트

## 📈 모니터링 (간소화)

### 핵심 메트릭
- API 응답 시간
- Google AI API 사용량 및 비용
- 캐시 히트율
- 사용자 만족도

### 지속적 개선
- 프롬프트 엔지니어링 최적화
- 응답 품질 모니터링
- 사용자 피드백 반영

## ✨ 구현의 핵심 장점

1. **개발 속도**: 복잡한 데이터 수집 로직 없이 빠른 구현
2. **유지보수**: 단일 API 의존성으로 관리 포인트 최소화
3. **확장성**: 프롬프트 수정만으로 기능 확장 가능
4. **비용 효율**: 캐싱으로 API 호출 최소화
5. **실시간성**: AI가 최신 정보에 직접 접근

이 간소화된 계획을 통해 빠르고 효율적인 AI Investment Opinion 기능을 구현할 수 있습니다.
