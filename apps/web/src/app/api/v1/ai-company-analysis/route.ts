import { NextRequest, NextResponse } from 'next/server';
import { getClaudeModel, getClaudeApiKey, CLAUDE_API_CONFIG } from '@/config/claude.config';

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
## Company Basic Information (Reference)
- Company Name: ${companyData.companyName}
- Sector: ${companyData.sector}
- Industry: ${companyData.industry}
- Market Cap: $${companyData.marketCap?.toLocaleString()}
- Employees: ${companyData.employees?.toLocaleString()}
` : '';

  return `You are a corporate analysis expert. Please provide a concise business analysis of ${symbol}.

${contextSection}

## Requirements
- Write **exactly 5 sentences**
- Each sentence should be **50-80 words**
- Analyze the company's business fundamentals **without investment recommendations**
- Reflect latest information (as of ${today})

## Content to Include (in order)
1. **Core Value Proposition**: What does this company do?
2. **Business Model**: How does it generate revenue?
3. **Competitive Advantage**: What strengths does it have compared to competitors?
4. **Key Risks and Opportunities**: What risks and opportunities exist?
5. **Financial Health**: What is the financial condition?

## Output Format
Output each sentence on a new line without numbering:
[Sentence 1]
[Sentence 2]
[Sentence 3]
[Sentence 4]
[Sentence 5]

## Important Notes
- Provide only fact-based business analysis`;
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

  const apiKey = getClaudeApiKey();
  const baseUrl = CLAUDE_API_CONFIG.baseUrl;
  const model = getClaudeModel('company-analysis');

  console.log(`🔑 Claude API Key status: ${apiKey ? 'Present (length: ' + apiKey.length + ')' : 'Missing'}`);
  console.log(`🤖 Using Claude model: ${model}`);

  if (!apiKey) {
    console.error('❌ Claude API key not configured');
    throw new Error('Claude API key not configured');
  }

  const prompt = buildCompanyAnalysisPrompt(symbol, companyData);
  console.log(`📝 Prompt length: ${prompt.length} characters`);

  console.log(`🌐 Making API call to: ${baseUrl}`);

  const requestBody = {
    model,
    max_tokens: 600,
    temperature: CLAUDE_API_CONFIG.defaultTemperature,
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
      'anthropic-version': CLAUDE_API_CONFIG.version
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
      `AI analysis for ${symbol} is temporarily unavailable.`,
      'Please check the Claude API connection and try again.',
      'Please try again in a few moments.',
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
