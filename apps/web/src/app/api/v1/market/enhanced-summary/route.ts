import { NextRequest, NextResponse } from 'next/server';

// Mock data that matches the EnhancedMarketSummary interface
const generateEnhancedMarketSummary = () => {
  return {
    fearGreedIndex: {
      value: 52,
      status: 'neutral' as const,
      confidence: 0.85,
      components: {
        marketVolatility: 45,
        marketVolume: 58,
        marketMomentum: 52,
        stockPriceBreadth: 48,
        safehavenDemand: 44,
        junkBondDemand: 51,
        putCallRatio: 49
      },
      methodology: "Based on 7 key market indicators",
      lastUpdated: new Date().toISOString(),
      source: "Investie AI Analysis"
    },
    
    economicIndicators: {
      interestRate: {
        value: 4.26,
        previousValue: 4.39,
        change: -0.13,
        percentChange: -2.96,
        basisPointsChange: -13,
        date: new Date().toISOString().split('T')[0],
        trend: 'falling' as const,
        source: "FRED API",
        aiOutlook: "Dovish stance expected"
      },
      cpi: {
        value: 322.1,
        previousValue: 321.5,
        change: 0.6,
        percentChange: 0.19,
        monthOverMonth: 0.20,
        yearOverYear: 2.73,
        date: new Date().toISOString().split('T')[0],
        trend: 'rising' as const,
        direction: 'up' as const,
        inflationPressure: 'moderate' as const,
        source: "Bureau of Labor Statistics"
      },
      unemployment: {
        value: 4.3,
        previousValue: 4.1,
        change: 0.2,
        percentChange: 4.88,
        monthOverMonth: 0.2,
        date: new Date().toISOString().split('T')[0],
        trend: 'rising' as const,
        employmentHealth: 'moderate' as const,
        source: "Bureau of Labor Statistics"
      }
    },
    
    sp500Sparkline: {
      data: generateSparklineData(),
      currentPrice: 647.24,
      weeklyChange: 1.09,
      weeklyTrend: 'up' as const,
      volatility: 'moderate' as const,
      marketSentiment: 'neutral' as const
    },
    
    sectorPerformance: [
      {
        sector: "Technology",
        ticker: "XLK",
        name: "Technology Select Sector SPDR Fund",
        price: 185.45,
        change: 2.15,
        changePercent: 2.1,
        volume: 12500000,
        marketCap: 45000000000,
        weeklyPerformance: 3.2,
        monthlyPerformance: 8.7,
        momentum: 'buy' as const,
        leadership: 'leader' as const,
        rotationSignal: 'inflow' as const,
        relativeStrength: 75,
        correlation: 0.85,
        lastUpdated: new Date().toISOString()
      },
      {
        sector: "Healthcare",
        ticker: "XLV", 
        name: "Health Care Select Sector SPDR Fund",
        price: 142.30,
        change: -0.85,
        changePercent: -0.6,
        volume: 8200000,
        marketCap: 32000000000,
        weeklyPerformance: 0.8,
        monthlyPerformance: 4.2,
        momentum: 'hold' as const,
        leadership: 'neutral' as const,
        rotationSignal: 'neutral' as const,
        relativeStrength: 52,
        correlation: 0.65,
        lastUpdated: new Date().toISOString()
      },
      {
        sector: "Finance",
        ticker: "XLF",
        name: "Financial Select Sector SPDR Fund", 
        price: 38.92,
        change: -0.32,
        changePercent: -0.8,
        volume: 15600000,
        marketCap: 28000000000,
        weeklyPerformance: -1.2,
        monthlyPerformance: 2.1,
        momentum: 'sell' as const,
        leadership: 'laggard' as const,
        rotationSignal: 'outflow' as const,
        relativeStrength: 35,
        correlation: 0.72,
        lastUpdated: new Date().toISOString()
      },
      {
        sector: "Energy",
        ticker: "XLE",
        name: "Energy Select Sector SPDR Fund",
        price: 89.15,
        change: 1.45,
        changePercent: 1.7,
        volume: 18200000,
        marketCap: 25000000000,
        weeklyPerformance: 2.8,
        monthlyPerformance: 6.9,
        momentum: 'buy' as const,
        leadership: 'leader' as const,
        rotationSignal: 'inflow' as const,
        relativeStrength: 68,
        correlation: 0.58,
        lastUpdated: new Date().toISOString()
      }
    ],
    
    lastUpdated: new Date().toISOString(),
    cacheInfo: {
      hitRate: 0.87,
      totalRequests: 1250,
      averageResponseTime: 145
    }
  };
};

// Generate mock sparkline data
function generateSparklineData() {
  const data = [];
  const basePrice = 645;
  const now = Date.now();
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString();
    const price = basePrice + (Math.random() - 0.5) * 10 + Math.sin(i / 5) * 5;
    const volume = Math.floor(Math.random() * 50000000) + 20000000;
    
    data.push({
      timestamp,
      price: Number(price.toFixed(2)),
      volume
    });
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  try {
    // Add CORS headers
    const response = NextResponse.json({
      success: true,
      data: generateEnhancedMarketSummary(),
      timestamp: new Date().toISOString()
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in enhanced-summary API:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch enhanced market summary'
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