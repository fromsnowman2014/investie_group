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

Conduct a comprehensive analysis to determine if the current market is at or near a bubble peak. Use the latest available data as of ${currentDate}.

## ANALYSIS FRAMEWORK (Internal Methodology)

Analyze these 10 categories using current data:

### 1. LEVERAGE & CREDIT INDICATORS
- NYSE margin debt as % of GDP vs historical peaks
- Retail leveraged participation (options volume, leveraged ETFs)
- Corporate debt to GDP ratio
- Covenant-lite loan prevalence

### 2. VALUATION METRICS
- Shiller P/E (CAPE Ratio): current vs historical percentiles
- Buffett Indicator: Total market cap to GDP
- Price-to-Sales ratios for S&P 500
- Forward P/E vs 10-year average

### 3. IPO & NEW ISSUANCE ACTIVITY
- IPO volume (number and dollar value)
- Percentage of unprofitable IPOs
- SPAC activity volume
- First-day pops vs historical norms

### 4. SPECULATIVE BEHAVIOR
- Meme stock activity
- Zero-DTE options volume as % of total
- Cryptocurrency correlation to equities
- Retail participation rates

### 5. MONETARY POLICY & INTEREST RATES
- Fed Funds Rate trajectory and real rates
- Yield curve status (inversion/normalization)
- QE/QT status and Fed balance sheet size

### 6. MARKET BREADTH & TECHNICAL
- Advance-Decline line divergences
- Market concentration (top 10 stocks % of S&P 500)
- VIX levels
- Deviation from 200-day moving average

### 7. SENTIMENT & BEHAVIORAL INDICATORS
- AAII Sentiment Survey (bulls vs bears ratio)
- Put/Call ratio
- Google Trends for speculative searches

### 8. MEDIA & CULTURAL SIGNALS
- Mainstream media coverage frequency
- Celebrity involvement in markets
- FOMO narratives prevalence

### 9. HISTORICAL PATTERN COMPARISON
Compare to: 1929, 1987, 2000, 2008, 2021 bubbles
Analyze: duration, magnitude, catalysts, policy environment

### 10. CONTRARIAN INDICATORS
- Insider trading buy/sell ratios
- Smart money positioning (Berkshire Hathaway cash, hedge fund positioning)
- Credit spreads (high yield)

---

## STRICT OUTPUT REQUIREMENTS (Optimized for Brevity)

Return ONLY valid JSON (no markdown code blocks). Follow this EXACT format:

{
  "verdict": "peak|near-peak|elevated|normal",
  "verdictText": "Two sentences: verdict + primary reason with key data",

  "indicators": {
    "leverageCredit": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: key metric | context. Example: '$745B margin (1.8% GDP vs 2.7% '21) | Corp debt 47%'"
    },
    "valuations": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'CAPE 35.2 (87%ile) | Buffett 198% | Fwd P/E 21.3x vs 16.8x'"
    },
    "ipoActivity": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: '108 IPOs '24 (-65% vs '21) | 25% unprofitable vs 80% '20-21'"
    },
    "speculation": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: '0-DTE 45% (was 5% '20) | Meme dormant | Crypto corr 0.35'"
    },
    "monetaryPolicy": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'FFR 4.75-5% | Real +2.5% | Curve norm | QT -$1.7T'"
    },
    "marketBreadth": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'Top 10: 34% SPX (50yr high) | A-D confirming | EW lag -8%'"
    },
    "sentiment": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'Bulls 47% vs Bears 24% | P/C 0.68 | Retail 18% | VIX 14'"
    },
    "mediaCulture": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'AI fundamentals focus | Low celeb advice | Skepticism high'"
    },
    "historicalPatterns": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: '23mo bull +65% | More '95-96 tech than '99-00 mania'"
    },
    "contrarianSignals": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "Micro-format: Example: 'Insider sell 4.2:1 | BRK cash $325B (28%) | HY 300bps'"
    }
  },

  "keyEvidence": [
    "Short format: 'Metric: Value (context)'",
    "Maximum 3 data points ONLY",
    "Example: 'CAPE: 34.8 (86th %ile since 1881)', 'Top 10: 36% of S&P (50yr high)', '0-DTE: 43% vol (instability risk)'"
  ],

  "historicalComparison": {
    "mostSimilarBubble": "1929|1987|2000|2008|2021|none",
    "similarities": []
  },

  "riskAssessment": {
    "correctionProbability": 45,
    "vulnerableSectors": [
      "Brief names ONLY, max 3 sectors",
      "Example: 'Mega-cap (Mag 7)', 'AI/semiconductors', 'Unprofitable growth'"
    ],
    "potentialCatalysts": []
  },

  "timeline": {
    "projectedPeakTimeframe": "Brief: 'Q2 2025' or 'Indeterminate' (optional)",
    "typicalDuration": "Brief: 'Bulls avg 5.5yr; at 2.1yr' (optional)",
    "reversalCatalysts": []
  },

  "contrarianViewpoint": [
    "SINGLE strongest argument ONLY",
    "Example: 'AI productivity revolution justifies valuations for infrastructure leaders with 20%+ earnings growth'"
  ],

  "recommendations": {
    "conservative": "Ultra-compact: '↓equity 50-60% | ↑cash 20-25% | dividend stocks P/E<20'",
    "moderate": "Ultra-compact: 'Rebalance from tech | equal-weight/value | 15-20% bonds'",
    "aggressive": "Ultra-compact: 'Diversify beyond Mag 7 | 10-15% cash for volatility | avoid leverage'"
  }
}

CRITICAL FORMATTING RULES (ULTRA-COMPACT OUTPUT):
✓ Indicator summaries: Micro-format with pipe separator (|), use abbreviations
✓ keyEvidence: MAXIMUM 3 points, ultra-brief format
✓ historicalComparison: mostSimilarBubble only, NO similarities array
✓ vulnerableSectors: MAXIMUM 3 sectors, brief names
✓ contrarianViewpoint: SINGLE argument only (not array, just one string)
✓ Recommendations: Ultra-compact with arrows (↓↑) and pipe separators
✓ timeline: Optional, keep very brief if included
✓ potentialCatalysts: Empty array (omit)
✓ reversalCatalysts: Empty array (omit)
✓ Use abbreviations: %ile for percentile, SPX for S&P 500, '21 for 2021, etc.
✓ Return ONLY the JSON object, no markdown formatting`;
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

    // Handle contrarianViewpoint as either string or array
    let contrarianViewpoint: string[] = [];
    if (parsed.contrarianViewpoint) {
      if (typeof parsed.contrarianViewpoint === 'string') {
        contrarianViewpoint = [parsed.contrarianViewpoint];
      } else if (Array.isArray(parsed.contrarianViewpoint)) {
        contrarianViewpoint = parsed.contrarianViewpoint;
      }
    }

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
      contrarianViewpoint: contrarianViewpoint,
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
    max_tokens: 2048,
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
