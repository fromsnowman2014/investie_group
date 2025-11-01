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
      "summary": "ONE sentence MAX, data-first. Example: 'NYSE margin $745B (1.8% GDP vs 2.7% 2021 peak); corporate debt 47% GDP stable.'"
    },
    "valuations": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with key metrics. Example: 'CAPE 35.2 (87th percentile); Buffett Indicator 198% (vs 215% 2021 peak); Forward P/E 21.3x vs 16.8x avg.'"
    },
    "ipoActivity": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with numbers. Example: '108 IPOs in 2024, down 65% from 2021; unprofitable IPOs 25% vs 80% in 2020-2021.'"
    },
    "speculation": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with volume data. Example: 'Zero-DTE options 45% of volume (up from 5% in 2020); meme stock activity dormant; crypto correlation 0.35.'"
    },
    "monetaryPolicy": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with rates. Example: 'Fed Funds 4.75-5.00%; real rates +2.5%; yield curve normalized after longest inversion; QT reduced balance sheet $1.7T.'"
    },
    "marketBreadth": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with concentration data. Example: 'Top 10 stocks 34% of S&P 500 (highest since 1970s); advance-decline line confirming; equal-weight lagging 8% YTD.'"
    },
    "sentiment": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with survey data. Example: 'AAII Bulls 47% vs Bears 24%; Put/Call 0.68; retail participation 18% vs 23% 2021 peak; VIX 14.'"
    },
    "mediaCulture": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence on coverage tone. Example: 'Focus on AI fundamentals vs get-rich-quick schemes; limited celebrity advice; skepticism remains widespread.'"
    },
    "historicalPatterns": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence comparing to past. Example: 'Bull market 23 months with 65% gain; more similar to 1995-96 tech leadership than 1999-2000 blow-off.'"
    },
    "contrarianSignals": {
      "score": "extreme|elevated|normal",
      "icon": "🔴|🟡|🟢",
      "summary": "ONE sentence with positioning. Example: 'Insider selling 4.2:1; Berkshire cash record $325B (28% of portfolio); HY spreads 300bps show confidence.'"
    }
  },

  "keyEvidence": [
    "Metric: Value (brief context) - Example: 'Shiller CAPE: 35.2 (87th percentile, elevated but not extreme)'",
    "Maximum 5 data points total",
    "Lead with the number, follow with context",
    "One line per point",
    "Include percentiles or vs-historical comparisons"
  ],

  "historicalComparison": {
    "mostSimilarBubble": "1929|1987|2000|2008|2021|none",
    "similarities": [
      "Maximum 3 bullet points",
      "One sentence each",
      "Focus on structural similarities"
    ]
  },

  "riskAssessment": {
    "correctionProbability": 45,
    "vulnerableSectors": [
      "Use brief names: 'AI/semiconductors', 'Mega-cap tech', 'Unprofitable growth'",
      "Maximum 5 sectors"
    ],
    "potentialCatalysts": [
      "Brief triggers: 'Fed policy error', 'Earnings disappointment', 'Geopolitical shock'",
      "Maximum 5 catalysts"
    ]
  },

  "timeline": {
    "projectedPeakTimeframe": "Brief estimate: 'Q1-Q2 2026' or 'Indeterminate'",
    "typicalDuration": "One sentence: 'Bull markets average 5.5yr; current at 2yr'",
    "reversalCatalysts": [
      "Maximum 3 triggers",
      "Brief format: 'Inflation resurgence', 'Credit event'"
    ]
  },

  "contrarianViewpoint": [
    "Maximum 3 strongest counter-arguments",
    "One sentence each",
    "Example: 'AI productivity gains justify premium valuations for tech leaders'",
    "Focus on data-backed bull case"
  ],

  "recommendations": {
    "conservative": "Single sentence with 2-3 specific actions. Example: 'Reduce equity to 50-60%, increase cash to 20-25%, focus on dividend stocks with P/E <20'",
    "moderate": "Single sentence with 2-3 specific actions. Example: 'Maintain 60-70% equity, rebalance from mega-cap tech to equal-weight/value, hold 15-20% bonds/cash'",
    "aggressive": "Single sentence with 2-3 specific actions. Example: 'Keep 80-90% equity but diversify beyond Mag 7, maintain 10-15% cash for volatility, avoid leverage'"
  }
}

CRITICAL FORMATTING RULES:
✓ Each indicator summary: ONE sentence maximum, data-first
✓ NO explanatory paragraphs - metrics and brief context only
✓ Include actual numbers for all key metrics (CAPE value, percentages, ratios)
✓ keyEvidence: Maximum 5 points, format "Metric: Value (context)"
✓ historicalComparison similarities: Maximum 3 points
✓ Recommendations: Single sentence per risk profile with specific actions
✓ Use brief sector names, avoid long descriptions
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
    max_tokens: 4096,
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
