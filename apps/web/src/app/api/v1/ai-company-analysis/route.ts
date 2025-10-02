import { NextRequest, NextResponse } from 'next/server';

// Using 'nodejs' runtime to access CLAUDE_API_KEY environment variable
export const runtime = 'nodejs';

// Simple in-memory cache
interface CacheEntry {
  data: CompanyAnalysisResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCachedResult(symbol: string): CompanyAnalysisResult | null {
  const entry = cache.get(symbol);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(symbol);
    return null;
  }

  return entry.data;
}

function setCachedResult(symbol: string, data: CompanyAnalysisResult): void {
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

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface CompanyAnalysisResult {
  success: boolean;
  symbol: string;
  analysis: string[];
  timestamp: string;
  error?: string;
}

interface CompanyData {
  companyName?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  employees?: number;
}

function buildCompanyAnalysisPrompt(symbol: string, companyData?: CompanyData): string {
  const today = new Date().toISOString().split('T')[0];

  const contextSection = companyData ? `
## 기업 기본 정보 (참고용)
- 회사명: ${companyData.companyName}
- 섹터: ${companyData.sector}
- 산업: ${companyData.industry}
- 시가총액: $${companyData.marketCap?.toLocaleString()}
- 직원 수: ${companyData.employees?.toLocaleString()}
` : '';

  return `당신은 기업 분석 전문가입니다. ${symbol} 기업에 대한 간결한 비즈니스 분석을 작성해주세요.

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
- 팩트 중심의 비즈니스 분석만 제공`;
}

function parseClaudeResponse(responseData: ClaudeResponse, symbol: string): CompanyAnalysisResult {
  try {
    const content = responseData.content[0].text;

    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => {
        // Filter out meta descriptions and preambles
        const lowerLine = line.toLowerCase();

        // Remove lines that are clearly meta-commentary
        if (lowerLine.includes('as a professional') ||
            lowerLine.includes('here\'s my') ||
            lowerLine.includes('here is my') ||
            lowerLine.includes('investment opinion') ||
            lowerLine.includes('analysis for') ||
            lowerLine.startsWith('note:') ||
            lowerLine.startsWith('disclaimer:') ||
            /^\d+[.)]\s/.test(line) // Remove numbered list markers
        ) {
          return false;
        }

        // Keep only substantive content (min 20 chars)
        return line.length >= 20;
      });

    // Take maximum 5 sentences
    const sentences = lines.slice(0, 5);

    return {
      success: true,
      symbol,
      analysis: sentences,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    throw new Error('Invalid response format from Claude API');
  }
}

async function generateCompanyAnalysis(symbol: string, companyData?: CompanyData): Promise<CompanyAnalysisResult> {
  // Check cache first
  const cached = getCachedResult(symbol);
  if (cached) {
    console.log(`🎯 Cache hit for company analysis ${symbol}`);
    return cached;
  }

  console.log(`🚀 Generating fresh company analysis for ${symbol}`);

  const apiKey = process.env.CLAUDE_API_KEY;
  const baseUrl = 'https://api.anthropic.com/v1/messages';

  console.log(`🔑 Claude API Key status: ${apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Missing'}`);

  if (!apiKey) {
    console.error('❌ Claude API key not configured');
    throw new Error('Claude API key not configured');
  }

  const prompt = buildCompanyAnalysisPrompt(symbol, companyData);
  console.log(`📝 Prompt length: ${prompt.length} characters`);

  console.log(`🌐 Making API call to: ${baseUrl}`);

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 600,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Claude API error: ${response.status} - ${errorText}`);
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as ClaudeResponse;
  const result = parseClaudeResponse(data, symbol);

  // Cache the result
  setCachedResult(symbol, result);
  console.log(`💾 Cached company analysis for ${symbol}`);

  return result;
}

function getFallbackAnalysis(symbol: string, error?: string): CompanyAnalysisResult {
  return {
    success: false,
    symbol,
    analysis: [
      `${symbol}에 대한 AI 분석을 일시적으로 사용할 수 없습니다.`,
      'Claude API 연결을 확인하고 다시 시도해주세요.',
      '잠시 후 다시 시도해주시기 바랍니다.',
      '',
      ''
    ],
    timestamp: new Date().toISOString(),
    error: error || 'Claude API call failed'
  };
}

export async function POST(request: NextRequest) {
  let symbol = 'UNKNOWN';

  try {
    const body = await request.json();
    symbol = body?.symbol;
    const companyData = body?.companyData;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const result = await generateCompanyAnalysis(symbol, companyData);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Company Analysis POST API Error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const fallback = getFallbackAnalysis(symbol, errorMessage);

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
    const result = await generateCompanyAnalysis(symbol);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Company Analysis GET API Error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const fallback = getFallbackAnalysis(symbol, errorMessage);

    return NextResponse.json({
      success: false,
      data: fallback,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
