import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Simple in-memory cache for Edge Runtime
interface CacheEntry {
  data: InvestmentOpinionResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

function getCachedResult(symbol: string): InvestmentOpinionResult | null {
  const entry = cache.get(symbol);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(symbol);
    return null;
  }
  
  return entry.data;
}

function setCachedResult(symbol: string, data: InvestmentOpinionResult): void {
  cache.set(symbol, {
    data,
    timestamp: Date.now()
  });
  
  // Clean up old entries to prevent memory leaks
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
}

interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface InvestmentOpinionResult {
  success: boolean;
  symbol: string;
  opinion: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  keyFactors: string[];
  timeframe?: string;
  lastUpdated: string;
  source: string;
  error?: string;
}

function buildComprehensivePrompt(symbol: string): string {
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

function extractRecommendation(content: string): 'BUY' | 'HOLD' | 'SELL' {
  const upperContent = content.toUpperCase();
  if (upperContent.includes('BUY')) return 'BUY';
  if (upperContent.includes('SELL')) return 'SELL';
  return 'HOLD';
}

function extractConfidence(content: string): number {
  const confidenceMatch = content.match(/신뢰도[\s:]*(\d+)/i);
  return confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
}

function extractTimeframe(content: string): string {
  if (content.includes('단기')) return '단기';
  if (content.includes('장기')) return '장기';
  if (content.includes('중기')) return '중기';
  return '중기';
}

function extractKeyFactors(content: string): string[] {
  const factors: string[] = [];
  if (content.includes('실적')) factors.push('실적 관련');
  if (content.includes('금리')) factors.push('금리 환경');
  if (content.includes('성장')) factors.push('성장성');
  if (content.includes('밸류에이션') || content.includes('PER')) factors.push('밸류에이션');
  if (content.includes('기술적')) factors.push('기술적 지표');
  return factors.length > 0 ? factors : ['종합 분석'];
}

function parseResponse(responseData: GoogleAIResponse): InvestmentOpinionResult {
  try {
    const content = responseData.candidates[0].content.parts[0].text;

    const recommendation = extractRecommendation(content);
    const confidence = extractConfidence(content);
    const timeframe = extractTimeframe(content);
    const keyFactors = extractKeyFactors(content);

    return {
      success: true,
      symbol: '',
      opinion: content.trim(),
      recommendation,
      confidence,
      keyFactors,
      timeframe,
      lastUpdated: new Date().toISOString(),
      source: 'google_ai_gemini'
    };
  } catch (err) {
    throw new Error('Invalid response format from Google AI');
  }
}

async function generateInvestmentOpinion(symbol: string): Promise<InvestmentOpinionResult> {
  // Check cache first
  const cached = getCachedResult(symbol);
  if (cached) {
    console.log(`🎯 Cache hit for ${symbol}`);
    return cached;
  }

  console.log(`🚀 Generating fresh AI opinion for ${symbol}`);
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const prompt = buildComprehensivePrompt(symbol);

  const response = await fetch(
    `${baseUrl}/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as GoogleAIResponse;
  const result = parseResponse(data);
  result.symbol = symbol;

  // Cache the result
  setCachedResult(symbol, result);
  console.log(`💾 Cached AI opinion for ${symbol}`);

  return result;
}

function getFallbackOpinion(symbol: string): InvestmentOpinionResult {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const result = await generateInvestmentOpinion(symbol);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Opinion API Error:', err);

    // Fallback response
    const symbol = (await request.json()).symbol || 'UNKNOWN';
    const fallback = getFallbackOpinion(symbol);

    return NextResponse.json({
      success: false,
      data: fallback,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await generateInvestmentOpinion(symbol);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Opinion API Error:', err);

    const fallback = getFallbackOpinion(symbol);

    return NextResponse.json({
      success: false,
      data: fallback,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
