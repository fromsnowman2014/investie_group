import { NextResponse } from 'next/server';

// Mock news analysis data
const generateNewsAnalysis = (symbol: string) => {
  interface NewsAnalysisData {
    symbol: string;
    sentiment: string;
    sentimentScore: number;
    confidence: number;
    newsCount: number;
    timeframe: string;
    keyTopics: Array<{
      topic: string;
      sentiment: number;
      mentions: number;
    }>;
    headlines: Array<{
      title: string;
      source: string;
      sentiment: number;
      timestamp: string;
      summary: string;
    }>;
    aiSummary: {
      mainTheme: string;
      keyInsights: string[];
      investmentImplication: string;
      riskFactors: string[];
      catalysts: string[];
    };
    lastUpdated: string;
    analysisVersion: string;
  }

  const newsAnalyses: Record<string, NewsAnalysisData> = {
    AAPL: {
      symbol: 'AAPL',
      sentiment: 'bullish',
      sentimentScore: 0.73,
      confidence: 0.89,
      newsCount: 24,
      timeframe: '24h',
      keyTopics: [
        { topic: 'iPhone 15 Sales', sentiment: 0.82, mentions: 8 },
        { topic: 'Vision Pro', sentiment: 0.65, mentions: 5 },
        { topic: 'Services Revenue', sentiment: 0.78, mentions: 6 },
        { topic: 'China Market', sentiment: -0.32, mentions: 3 }
      ],
      headlines: [
        {
          title: 'Apple iPhone 15 Pro Sales Exceed Expectations in Q4',
          source: 'Reuters',
          sentiment: 0.85,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          summary: 'Strong demand for iPhone 15 Pro models drives better than expected quarterly performance.'
        },
        {
          title: 'Apple Vision Pro Production Ramp Up Signals Strong Demand',
          source: 'Bloomberg', 
          sentiment: 0.72,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          summary: 'Manufacturing partners report increased Vision Pro orders for 2024.'
        },
        {
          title: 'Apple Services Revenue Hits New Record High',
          source: 'Wall Street Journal',
          sentiment: 0.88,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          summary: 'App Store, iCloud, and subscription services drive 21% YoY growth.'
        },
        {
          title: 'Apple Faces Regulatory Challenges in EU Markets',
          source: 'Financial Times',
          sentiment: -0.45,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          summary: 'New EU regulations may impact App Store revenue model.'
        }
      ],
      aiSummary: {
        mainTheme: 'Strong product performance offset by regulatory concerns',
        keyInsights: [
          'iPhone 15 sales momentum continues to exceed analyst expectations',
          'Vision Pro represents meaningful new product category expansion',
          'Services business maintaining high growth trajectory',
          'EU regulatory pressure poses medium-term headwinds'
        ],
        investmentImplication: 'BUY',
        riskFactors: ['Regulatory compliance costs', 'China market volatility'],
        catalysts: ['Holiday season sales', 'Vision Pro mainstream adoption']
      },
      lastUpdated: new Date().toISOString(),
      analysisVersion: 'v2.0.1'
    },
    MSFT: {
      symbol: 'MSFT',
      sentiment: 'very_bullish',
      sentimentScore: 0.85,
      confidence: 0.91,
      newsCount: 18,
      timeframe: '24h',
      keyTopics: [
        { topic: 'Azure Growth', sentiment: 0.89, mentions: 7 },
        { topic: 'AI Integration', sentiment: 0.92, mentions: 6 },
        { topic: 'Copilot Adoption', sentiment: 0.78, mentions: 4 },
        { topic: 'Gaming Segment', sentiment: -0.15, mentions: 2 }
      ],
      headlines: [
        {
          title: 'Microsoft Azure AI Services See 40% Quarter-over-Quarter Growth',
          source: 'TechCrunch',
          sentiment: 0.92,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          summary: 'Enterprise AI adoption driving unprecedented Azure growth rates.'
        },
        {
          title: 'Microsoft Copilot Reaches 10 Million Enterprise Users',
          source: 'The Information',
          sentiment: 0.87,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          summary: 'Faster than expected enterprise adoption of AI-powered productivity tools.'
        },
        {
          title: 'Microsoft Partners Expand AI Infrastructure Investments',
          source: 'Reuters',
          sentiment: 0.79,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          summary: 'Major cloud partners commit additional $2B for AI infrastructure.'
        }
      ],
      aiSummary: {
        mainTheme: 'AI leadership driving exceptional enterprise growth',
        keyInsights: [
          'Azure AI services showing remarkable 40% QoQ growth trajectory',
          'Copilot enterprise adoption exceeding all internal projections',
          'Strategic AI partnerships creating sustainable competitive moats',
          'Cloud infrastructure investments positioning for long-term dominance'
        ],
        investmentImplication: 'STRONG_BUY',
        riskFactors: ['AI investment costs', 'Competition from Google Cloud'],
        catalysts: ['Enterprise AI adoption', 'New Copilot features', 'Partnership expansions']
      },
      lastUpdated: new Date().toISOString(),
      analysisVersion: 'v2.0.1'
    }
  };

  // Return specific analysis or default template
  return newsAnalyses[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    sentiment: 'neutral',
    sentimentScore: 0.50,
    confidence: 0.60,
    newsCount: 5,
    timeframe: '24h',
    keyTopics: [
      { topic: 'General Market', sentiment: 0.45, mentions: 3 },
      { topic: 'Company Performance', sentiment: 0.55, mentions: 2 }
    ],
    headlines: [
      {
        title: `${symbol.toUpperCase()} Shows Mixed Market Performance`,
        source: 'Market News',
        sentiment: 0.50,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        summary: `${symbol.toUpperCase()} maintains stable position amid market uncertainty.`
      }
    ],
    aiSummary: {
      mainTheme: 'Limited news coverage with neutral sentiment',
      keyInsights: [
        `${symbol.toUpperCase()} maintains stable market position`,
        'Limited major catalysts in recent news cycle'
      ],
      investmentImplication: 'HOLD',
      riskFactors: ['Market volatility', 'Limited catalysts'],
      catalysts: ['Earnings reports', 'Product announcements']
    },
    lastUpdated: new Date().toISOString(),
    analysisVersion: 'v2.0.1'
  };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required'
      }, { status: 400 });
    }

    const newsAnalysis = generateNewsAnalysis(symbol);
    
    const response = NextResponse.json({
      success: true,
      data: newsAnalysis,
      timestamp: new Date().toISOString()
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in news-analysis API:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news analysis'
    }, { status: 500 });

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}