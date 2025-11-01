import { NextResponse } from 'next/server';
import { getClaudeModel, getClaudeApiKey, CLAUDE_API_CONFIG } from '@/config/claude.config';
import type {
  BubbleAnalysisData,
  BubbleVerdict,
  IndicatorLevel,
  IndicatorIcon,
  HistoricalBubble,
  BubbleIndicators,
} from '@/types/bubble-analysis';

// Node.js runtime for accessing server-side environment variables
export const runtime = 'nodejs';

// Cache configuration
interface CacheEntry {
  data: BubbleAnalysisData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_KEY = 'bubble-analysis';

function getCachedResult(): BubbleAnalysisData | null {
  const entry = cache.get(CACHE_KEY);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(CACHE_KEY);
    return null;
  }

  return entry.data;
}

function setCachedResult(data: BubbleAnalysisData): void {
  cache.set(CACHE_KEY, {
    data,
    timestamp: Date.now(),
  });
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

function buildBubbleAnalysisPrompt(): string {
  const currentDate = new Date().toISOString().split('T')[0];

  return `You are a veteran market analyst with expertise in identifying asset bubbles.

Conduct a comprehensive analysis to determine if the current market is at or near a bubble peak. Use the latest available data and provide evidence-based conclusions.

**Analysis Date: ${currentDate}**

## ANALYSIS FRAMEWORK

### 1. LEVERAGE & CREDIT INDICATORS
- Analyze NYSE margin debt as % of GDP and vs historical peaks
- Evidence of widespread use of options, leverage ETFs by retail investors
- Corporate debt to GDP ratio
- Covenant-lite loan prevalence

### 2. VALUATION METRICS
- Shiller P/E (CAPE Ratio) current level vs historical percentiles
- Buffett Indicator: Total market cap to GDP ratio
- Price-to-Sales ratios for S&P 500
- Forward P/E comparison to historical averages
- EV/EBITDA multiples vs historical norms

### 3. IPO & NEW ISSUANCE ACTIVITY
- IPO volume and first-day returns
- Percentage of unprofitable companies going public
- SPAC activity levels
- Secondary offerings and insider selling

### 4. SPECULATIVE BEHAVIOR
- Meme stock activity levels
- Zero-DTE options trading volume
- Cryptocurrency market correlation
- Sector rotation into high-risk segments

### 5. MONETARY POLICY & INTEREST RATES
- Fed Funds Rate trajectory and current restrictiveness
- Yield curve status (inversion/duration)
- Real interest rates (nominal minus inflation)
- Central bank balance sheet (QE/QT status)

### 6. MARKET BREADTH & TECHNICAL
- Advance-Decline line divergences
- New Highs vs New Lows ratio
- Market concentration (weight of top 10 stocks)
- VIX levels and complacency indicators

### 7. SENTIMENT & BEHAVIORAL INDICATORS
- AAII Sentiment Survey (bulls vs bears)
- Put/Call ratio positioning
- Retail participation rate trends
- Social media sentiment analysis

### 8. MEDIA & CULTURAL SIGNALS
- Mainstream media coverage frequency
- Celebrity investment advice prevalence
- "This time is different" rhetoric
- Investment product launch activity

### 9. HISTORICAL PATTERN COMPARISON
Compare current conditions to past bubbles:
- 1929 Stock Market Bubble
- 1987 Black Monday
- 2000 Dot-com Bubble
- 2008 Housing/Financial Crisis
- 2021 Everything Bubble

Identify similarities and differences in duration, magnitude, catalysts, and policy environment.

### 10. CONTRARIAN INDICATORS
- Insider trading buy/sell ratios
- Smart money positioning (hedge funds, Berkshire Hathaway cash)
- Credit spreads (investment grade and high yield)

## OUTPUT REQUIREMENTS

Provide a structured JSON response with the following format:

{
  "verdict": "peak|near-peak|elevated|normal",
  "verdictText": "2-3 sentence executive summary",
  "indicators": {
    "leverageCredit": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "valuations": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "ipoActivity": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "speculation": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "monetaryPolicy": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "marketBreadth": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "sentiment": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "mediaCulture": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "historicalPatterns": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"},
    "contrarianSignals": {"score": "extreme|elevated|normal", "icon": "🔴|🟡|🟢", "summary": "brief explanation"}
  },
  "keyEvidence": ["5 most compelling data points"],
  "historicalComparison": {
    "mostSimilarBubble": "1929|1987|2000|2008|2021|none",
    "similarities": ["list of similarities"],
    "differences": ["list of differences"]
  },
  "riskAssessment": {
    "correctionProbability": 0-100,
    "vulnerableSectors": ["list of sectors"],
    "potentialCatalysts": ["list of catalysts"]
  },
  "timeline": {
    "projectedPeakTimeframe": "timeframe if bubble detected",
    "typicalDuration": "historical duration",
    "reversalCatalysts": ["potential triggers"]
  },
  "contrarianViewpoint": ["strongest arguments against bubble thesis"],
  "recommendations": {
    "conservative": "advice for conservative investors",
    "moderate": "advice for moderate risk tolerance",
    "aggressive": "advice for aggressive investors"
  }
}

Use current market data and be specific with numbers, percentages, and timeframes. Return ONLY valid JSON without markdown formatting.`;
}

function parseIndicatorLevel(text: string): { level: IndicatorLevel; icon: IndicatorIcon } {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('extreme') || lowerText.includes('🔴')) {
    return { level: 'extreme', icon: '🔴' };
  }
  if (lowerText.includes('elevated') || lowerText.includes('🟡')) {
    return { level: 'elevated', icon: '🟡' };
  }
  return { level: 'normal', icon: '🟢' };
}

function parseClaudeResponse(responseData: ClaudeResponse): BubbleAnalysisData {
  try {
    const content = responseData.content[0].text;

    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedContent);

    // Ensure all indicators have proper icon format
    interface ParsedIndicator {
      score?: string;
      icon?: IndicatorIcon;
      summary?: string;
    }
    const indicators = Object.entries(parsed.indicators || {}).reduce(
      (acc, [key, value]) => {
        const indicatorValue = value as ParsedIndicator;
        const { level, icon } = parseIndicatorLevel(indicatorValue.score || 'normal');
        const finalIcon: IndicatorIcon = (indicatorValue.icon as IndicatorIcon) || icon;
        acc[key] = {
          score: level,
          icon: finalIcon,
          summary: indicatorValue.summary || 'No data available',
        };
        return acc;
      },
      {} as Record<string, { score: IndicatorLevel; icon: IndicatorIcon; summary: string }>
    );

    return {
      success: true,
      verdict: (parsed.verdict || 'normal') as BubbleVerdict,
      verdictText: parsed.verdictText || 'Analysis in progress',
      indicators: indicators as unknown as BubbleIndicators,
      keyEvidence: parsed.keyEvidence || [],
      historicalComparison: {
        mostSimilarBubble: (parsed.historicalComparison?.mostSimilarBubble || 'none') as HistoricalBubble,
        similarities: parsed.historicalComparison?.similarities || [],
        differences: parsed.historicalComparison?.differences || [],
      },
      riskAssessment: {
        correctionProbability: parsed.riskAssessment?.correctionProbability || 0,
        vulnerableSectors: parsed.riskAssessment?.vulnerableSectors || [],
        potentialCatalysts: parsed.riskAssessment?.potentialCatalysts || [],
      },
      timeline: parsed.timeline,
      contrarianViewpoint: parsed.contrarianViewpoint || [],
      recommendations: {
        conservative: parsed.recommendations?.conservative || 'Maintain diversified portfolio',
        moderate: parsed.recommendations?.moderate || 'Balance risk and opportunity',
        aggressive: parsed.recommendations?.aggressive || 'Consider market conditions',
      },
      lastUpdated: new Date().toISOString(),
      source: 'claude-sonnet-4-5',
      analysisDate: new Date().toISOString().split('T')[0],
    };
  } catch (err) {
    console.error('❌ Failed to parse Claude response:', err);
    throw new Error('Invalid response format from Claude API');
  }
}

async function generateBubbleAnalysis(): Promise<BubbleAnalysisData> {
  // Check cache first
  const cached = getCachedResult();
  if (cached) {
    console.log('🎯 Cache hit for bubble analysis');
    return cached;
  }

  console.log('🚀 Generating fresh bubble analysis with Claude');

  const apiKey = getClaudeApiKey();
  const baseUrl = CLAUDE_API_CONFIG.baseUrl;
  const model = getClaudeModel('bubble-detection');

  console.log(`🔑 Claude API Key status: ${apiKey ? 'Present' : 'Missing'}`);
  console.log(`🤖 Using Claude model: ${model}`);

  if (!apiKey) {
    console.error('❌ Claude API key not configured');
    throw new Error('Claude API key not configured');
  }

  const prompt = buildBubbleAnalysisPrompt();
  console.log(`📝 Prompt length: ${prompt.length} characters`);

  const requestBody = {
    model,
    max_tokens: 8192,
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  console.log('🌐 Calling Claude API...');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': CLAUDE_API_CONFIG.version,
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`📡 [Bubble Analysis] API Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [Bubble Analysis] Claude API error details:`, {
      status: response.status,
      statusText: response.statusText,
      model: model,
      error: errorText
    });
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as ClaudeResponse;
  console.log(`✅ Claude API success - Input tokens: ${data.usage.input_tokens}, Output tokens: ${data.usage.output_tokens}`);

  const result = parseClaudeResponse(data);

  // Cache the result
  setCachedResult(result);
  console.log('💾 Cached bubble analysis');

  return result;
}

function getFallbackAnalysis(error?: string): BubbleAnalysisData {
  return {
    success: false,
    verdict: 'normal',
    verdictText:
      'Market bubble analysis is temporarily unavailable. Please check back shortly.',
    indicators: {
      leverageCredit: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      valuations: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      ipoActivity: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      speculation: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      monetaryPolicy: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      marketBreadth: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      sentiment: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      mediaCulture: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      historicalPatterns: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
      contrarianSignals: { score: 'normal', icon: '🟢', summary: 'Data unavailable' },
    },
    keyEvidence: [],
    historicalComparison: {
      mostSimilarBubble: 'none',
      similarities: [],
      differences: [],
    },
    riskAssessment: {
      correctionProbability: 0,
      vulnerableSectors: [],
      potentialCatalysts: [],
    },
    contrarianViewpoint: [],
    recommendations: {
      conservative: 'Analysis unavailable - maintain diversified portfolio',
      moderate: 'Analysis unavailable - consult financial advisor',
      aggressive: 'Analysis unavailable - exercise caution',
    },
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
    analysisDate: new Date().toISOString().split('T')[0],
    error: error || 'Claude API call failed',
  };
}

export async function GET() {
  try {
    console.log('📊 Bubble Analysis API called');

    const analysis = await generateBubbleAnalysis();

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('❌ Bubble Analysis API error:', error);

    const fallback = getFallbackAnalysis(
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        success: false,
        data: fallback,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
