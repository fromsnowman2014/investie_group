import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    symbol: string;
  };
}

// Mock AI analysis data
const generateAIAnalysis = (symbol: string) => {
  const analyses: Record<string, any> = {
    AAPL: {
      symbol: 'AAPL',
      recommendation: 'BUY',
      confidence: 0.87,
      targetPrice: 210.00,
      currentPrice: 185.45,
      upside: 13.24,
      reasoning: {
        bullishPoints: [
          'Strong iPhone 15 sales momentum',
          'Growing services revenue with 21% YoY growth',
          'Vision Pro product category expansion',
          'Robust balance sheet with $166B cash'
        ],
        bearishPoints: [
          'China market headwinds',
          'Mac and iPad revenue decline',
          'High valuation at 28.5x P/E'
        ],
        keyRisks: [
          'Regulatory pressure in Europe',
          'Supply chain disruptions',
          'Economic slowdown impact on premium products'
        ]
      },
      technicalAnalysis: {
        trend: 'bullish',
        support: 175.00,
        resistance: 195.00,
        rsi: 58.3,
        macd: 'positive_crossover',
        movingAverages: {
          sma20: 182.45,
          sma50: 178.92,
          sma200: 165.78
        }
      },
      fundamentals: {
        pe: 28.5,
        peg: 2.1,
        priceToBook: 12.8,
        debtToEquity: 1.73,
        roe: 0.563,
        grossMargin: 0.447,
        operatingMargin: 0.267
      },
      aiInsights: [
        'Apple\'s ecosystem lock-in continues to drive recurring revenue',
        'AI integration in iOS 18 could be a significant catalyst',
        'Valuation premium justified by consistent execution'
      ],
      lastUpdated: new Date().toISOString(),
      analysisVersion: 'v2.1.0'
    },
    MSFT: {
      symbol: 'MSFT',
      recommendation: 'BUY',
      confidence: 0.92,
      targetPrice: 480.00,
      currentPrice: 415.26,
      upside: 15.58,
      reasoning: {
        bullishPoints: [
          'Azure cloud growth at 25% YoY',
          'AI integration across product suite',
          'Office 365 subscriber growth',
          'Strong enterprise relationships'
        ],
        bearishPoints: [
          'Gaming segment challenges',
          'Increased competition in cloud',
          'High expectations already priced in'
        ],
        keyRisks: [
          'Cloud market saturation',
          'Regulatory scrutiny on AI',
          'Economic impact on enterprise spending'
        ]
      },
      technicalAnalysis: {
        trend: 'bullish',
        support: 395.00,
        resistance: 445.00,
        rsi: 62.1,
        macd: 'bullish',
        movingAverages: {
          sma20: 422.15,
          sma50: 408.33,
          sma200: 385.92
        }
      },
      fundamentals: {
        pe: 32.1,
        peg: 1.8,
        priceToBook: 8.2,
        debtToEquity: 0.31,
        roe: 0.389,
        grossMargin: 0.691,
        operatingMargin: 0.421
      },
      aiInsights: [
        'Microsoft is best positioned to monetize AI revolution',
        'Azure OpenAI services driving enterprise adoption',
        'Copilot integration creating new revenue streams'
      ],
      lastUpdated: new Date().toISOString(),
      analysisVersion: 'v2.1.0'
    }
  };

  // Return specific analysis or default template
  return analyses[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    recommendation: 'HOLD',
    confidence: 0.65,
    targetPrice: 100.00,
    currentPrice: 95.00,
    upside: 5.26,
    reasoning: {
      bullishPoints: ['Market position', 'Financial stability'],
      bearishPoints: ['Limited growth catalysts', 'Sector headwinds'],
      keyRisks: ['Market volatility', 'Competition']
    },
    technicalAnalysis: {
      trend: 'neutral',
      support: 90.00,
      resistance: 105.00,
      rsi: 50.0,
      macd: 'neutral',
      movingAverages: {
        sma20: 95.50,
        sma50: 94.20,
        sma200: 92.10
      }
    },
    fundamentals: {
      pe: 20.0,
      peg: 1.5,
      priceToBook: 2.5,
      debtToEquity: 0.5,
      roe: 0.15,
      grossMargin: 0.35,
      operatingMargin: 0.18
    },
    aiInsights: [
      `${symbol.toUpperCase()} shows mixed signals in current market conditions`,
      'Consider broader market trends before making investment decisions'
    ],
    lastUpdated: new Date().toISOString(),
    analysisVersion: 'v2.1.0'
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { symbol } = await params;
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required'
      }, { status: 400 });
    }

    const analysis = generateAIAnalysis(symbol);
    
    const response = NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in ai-analysis API:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch AI analysis'
    }, { status: 500 });

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}