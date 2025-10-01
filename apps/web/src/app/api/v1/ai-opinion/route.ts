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
You are a professional investment analyst. Please provide a comprehensive investment opinion for ${symbol} stock.

## Analysis Request (Based on ${currentDate})

Please analyze the following information based on the latest data and provide an investment opinion:

### 🧭 Macro (Market-wide) Information Analysis
- CNN Fear & Greed Index current value and status
- VIX (Volatility Index) current level and implications
- US Federal Funds Rate current level and outlook
- US CPI (Consumer Price Index) latest figures and trends
- US Unemployment Rate latest data and employment market conditions
- S&P500 current level and recent movements
- US Liquidity trends including M2 Money Supply and Reverse Repo operations

### 🔬 Micro (Individual Stock) Information Analysis - ${symbol}
- P/E Ratio current level and sector comparison
- EPS (Earnings Per Share) recent performance and growth rate
- RSI (Relative Strength Index) current level and technical analysis
- Recent key news and issues this week
- Most recent earnings announcement results analysis
- Upcoming earnings announcement dates (if any)
- Dividend trend (increasing/decreasing/maintaining)
- Company's forward guidance (positive/negative outlook)
- Analyst average target price and upside/downside vs current price

## 📋 Output Requirements
1. Write in **exactly 10 lines or less**
2. Each line should be **clear and concise**
3. Include a clear **BUY/HOLD/SELL** recommendation
4. Mention **key risks and opportunities**
5. Provide **investment timeframe** (short-term/medium-term/long-term)
6. Include **confidence score** (1-100)
7. **Balance macro and micro factors** in the analysis

## 💡 Investment Opinion (10 lines or less):
`;
}

function extractRecommendation(content: string): 'BUY' | 'HOLD' | 'SELL' {
  const upperContent = content.toUpperCase();
  if (upperContent.includes('BUY')) return 'BUY';
  if (upperContent.includes('SELL')) return 'SELL';
  return 'HOLD';
}

function extractConfidence(content: string): number {
  // Look for confidence score in English
  const confidenceMatch = content.match(/confidence[\s:]*(\d+)/i);
  return confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
}

function extractTimeframe(content: string): string {
  if (content.toLowerCase().includes('short-term') || content.toLowerCase().includes('short term')) return 'Short-term';
  if (content.toLowerCase().includes('long-term') || content.toLowerCase().includes('long term')) return 'Long-term';
  if (content.toLowerCase().includes('medium-term') || content.toLowerCase().includes('medium term')) return 'Medium-term';
  return 'Medium-term';
}

function extractKeyFactors(content: string): string[] {
  const factors: string[] = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('earnings') || lowerContent.includes('eps')) factors.push('Earnings Performance');
  if (lowerContent.includes('interest rate') || lowerContent.includes('fed rate')) factors.push('Interest Rate Environment');
  if (lowerContent.includes('growth') || lowerContent.includes('revenue')) factors.push('Growth Prospects');
  if (lowerContent.includes('valuation') || lowerContent.includes('p/e') || lowerContent.includes('pe ratio')) factors.push('Valuation');
  if (lowerContent.includes('technical') || lowerContent.includes('rsi')) factors.push('Technical Indicators');
  if (lowerContent.includes('risk') || lowerContent.includes('volatility')) factors.push('Risk Factors');
  if (lowerContent.includes('market') || lowerContent.includes('macro')) factors.push('Market Conditions');
  
  return factors.length > 0 ? factors : ['Comprehensive Analysis'];
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

  console.log(`🔑 API Key status: ${apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Missing'}`);

  if (!apiKey) {
    console.error('❌ Google AI API key not configured');
    throw new Error('Google AI API key not configured');
  }

  const prompt = buildComprehensivePrompt(symbol);
  console.log(`📝 Prompt length: ${prompt.length} characters`);

  console.log(`🌐 Making API call to: ${baseUrl}/models/gemini-pro:generateContent`);
  
  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
      topP: 0.8,
      topK: 40
    }
  };

  const response = await fetch(
    `${baseUrl}/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }
  );

  console.log(`📡 API Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google AI API error: ${response.status} - ${errorText}`);
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

function getFallbackOpinion(symbol: string, error?: string): InvestmentOpinionResult {
  return {
    success: false,
    symbol,
    opinion: `AI analysis for ${symbol} is temporarily unavailable. Please check Google AI API connection and try again.`,
    recommendation: 'HOLD',
    confidence: 0,
    keyFactors: ['API Error'],
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
    error: error || 'Google AI API call failed'
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
    console.error('❌ AI Opinion API Error:', err);

    // Fallback response
    const body = await request.json();
    const symbol = body?.symbol || 'UNKNOWN';
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const fallback = getFallbackOpinion(symbol, errorMessage);

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
    console.error('❌ AI Opinion GET API Error:', err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const fallback = getFallbackOpinion(symbol, errorMessage);

    return NextResponse.json({
      success: false,
      data: fallback,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
