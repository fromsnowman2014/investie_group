// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface MarketOverviewResponse {
  indices: {
    sp500: IndexData;
    nasdaq: IndexData;
    dow: IndexData;
  };
  sectors: SectorData[];
  economicIndicators?: {
    interestRate?: EconomicIndicator;
    cpi?: EconomicIndicator;
    unemployment?: EconomicIndicator;
  };
  fearGreedIndex?: {
    value: number;
    status: string;
    confidence: number;
  };
  vix?: {
    value: number;
    status: string;
    interpretation: string;
  };
  marketSentiment: string;
  volatilityIndex: number;
  source: string;
  lastUpdated: string;
}

interface IndexData {
  value: number;
  change: number;
  changePercent: number;
}

interface SectorData {
  name: string;
  change: number;
  performance: 'positive' | 'negative';
}

interface EconomicIndicator {
  value: number;
  previousValue?: number;
  change?: number;
  percentChange?: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  source: string;
}

async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<any> {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`Alpha Vantage API error for ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data['Global Quote'] || null;
  } catch (error) {
    console.error(`Error fetching ${symbol} data:`, error.message);
    return null;
  }
}

async function fetchSectorPerformance(apiKey: string): Promise<SectorData[]> {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=SECTOR&apikey=${apiKey}`, {
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn(`Alpha Vantage Sector API error: ${response.status}`);
      return getMockSectorData();
    }

    const data = await response.json();
    const rankingData = data['Rank A: Real-Time Performance'] || {};

    return Object.entries(rankingData)
      .slice(0, 8)
      .map(([name, change]: [string, any]) => ({
        name: name.replace(/\s+/g, ' ').trim(),
        change: parseFloat(change.replace('%', '')),
        performance: parseFloat(change.replace('%', '')) > 0 ? 'positive' : 'negative',
      }));
  } catch (error) {
    console.error('Error fetching sector data:', error.message);
    return getMockSectorData();
  }
}

async function fetchFREDData(seriesId: string, apiKey: string): Promise<EconomicIndicator | null> {
  try {
    const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`FRED API error for ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const observations = data.observations || [];
    
    if (observations.length < 1) {
      return null;
    }

    const current = observations[0];
    const previous = observations[1];

    const currentValue = parseFloat(current.value);
    const previousValue = previous ? parseFloat(previous.value) : currentValue;
    const change = currentValue - previousValue;
    const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      value: currentValue,
      previousValue,
      change,
      percentChange,
      date: current.date,
      trend: change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable',
      source: 'fred_api'
    };
  } catch (error) {
    console.error(`Error fetching FRED data for ${seriesId}:`, error.message);
    return null;
  }
}

async function fetchVIXData(apiKey: string): Promise<{ value: number; status: string; interpretation: string } | null> {
  try {
    const vixData = await fetchAlphaVantageQuote('VIX', apiKey);
    
    if (!vixData) {
      return null;
    }

    const vixValue = parseFloat(vixData['05. price']) || 20;
    
    let status: string;
    let interpretation: string;

    if (vixValue < 15) {
      status = 'very_low';
      interpretation = 'Very low volatility - market complacency';
    } else if (vixValue < 20) {
      status = 'low';
      interpretation = 'Low volatility - stable market conditions';
    } else if (vixValue < 30) {
      status = 'moderate';
      interpretation = 'Moderate volatility - normal market fluctuations';
    } else if (vixValue < 40) {
      status = 'high';
      interpretation = 'High volatility - increased market uncertainty';
    } else {
      status = 'very_high';
      interpretation = 'Very high volatility - market stress or panic';
    }

    return {
      value: vixValue,
      status,
      interpretation
    };
  } catch (error) {
    console.error('Error fetching VIX data:', error.message);
    return null;
  }
}

function calculateFearGreedIndex(sp500Change: number, vixValue: number, volumeMetric: number = 50): { value: number; status: string; confidence: number } {
  // Simplified Fear & Greed calculation based on available metrics
  let score = 50; // Start neutral
  
  // Market momentum component (based on S&P 500 change)
  if (sp500Change > 1) score += 15;
  else if (sp500Change > 0) score += 5;
  else if (sp500Change < -1) score -= 15;
  else if (sp500Change < 0) score -= 5;
  
  // Volatility component (inverse relationship with VIX)
  if (vixValue < 15) score += 10; // Low volatility = greed
  else if (vixValue < 20) score += 5;
  else if (vixValue > 30) score -= 10; // High volatility = fear
  else if (vixValue > 25) score -= 5;
  
  // Volume component (simplified)
  score += (volumeMetric - 50) / 10;
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  let status: string;
  if (score >= 75) status = 'extreme_greed';
  else if (score >= 55) status = 'greed';
  else if (score >= 45) status = 'neutral';
  else if (score >= 25) status = 'fear';
  else status = 'extreme_fear';
  
  return {
    value: Math.round(score),
    status,
    confidence: 65 // Medium confidence for simplified calculation
  };
}

function extractIndexData(apiData: any): IndexData {
  if (!apiData) {
    return { value: 0, change: 0, changePercent: 0 };
  }

  return {
    value: parseFloat(apiData['05. price']) || 0,
    change: parseFloat(apiData['09. change']) || 0,
    changePercent: parseFloat(apiData['10. change percent']?.replace('%', '')) || 0,
  };
}

function calculateMarketSentiment(indexData: IndexData[]): string {
  const positiveCount = indexData.filter(data => data.change > 0).length;
  
  if (positiveCount >= 2) return 'bullish';
  if (positiveCount === 1) return 'neutral';
  return 'bearish';
}

function getMockSectorData(): SectorData[] {
  return [
    { name: 'Technology', change: 0.25, performance: 'positive' },
    { name: 'Healthcare', change: -0.15, performance: 'negative' },
    { name: 'Energy', change: 1.23, performance: 'positive' },
    { name: 'Financial Services', change: 0.45, performance: 'positive' },
    { name: 'Consumer Discretionary', change: -0.08, performance: 'negative' },
    { name: 'Industrials', change: 0.67, performance: 'positive' },
    { name: 'Materials', change: 0.12, performance: 'positive' },
    { name: 'Utilities', change: -0.33, performance: 'negative' }
  ];
}

function getMockMarketOverview(): MarketOverviewResponse {
  return {
    indices: {
      sp500: { value: 4150.23, change: 12.45, changePercent: 0.3 },
      nasdaq: { value: 12850.67, change: -23.12, changePercent: -0.18 },
      dow: { value: 34250.89, change: 45.67, changePercent: 0.13 },
    },
    sectors: getMockSectorData(),
    economicIndicators: {
      interestRate: {
        value: 4.25,
        previousValue: 4.10,
        change: 0.15,
        percentChange: 3.66,
        date: new Date().toISOString().split('T')[0],
        trend: 'rising',
        source: 'mock_data'
      },
      cpi: {
        value: 307.2,
        previousValue: 306.8,
        change: 0.4,
        percentChange: 0.13,
        date: new Date().toISOString().split('T')[0],
        trend: 'rising',
        source: 'mock_data'
      },
      unemployment: {
        value: 3.8,
        previousValue: 3.9,
        change: -0.1,
        percentChange: -2.56,
        date: new Date().toISOString().split('T')[0],
        trend: 'falling',
        source: 'mock_data'
      }
    },
    fearGreedIndex: {
      value: 52,
      status: 'neutral',
      confidence: 60
    },
    vix: {
      value: 18.45,
      status: 'low',
      interpretation: 'Low volatility environment suggesting market stability'
    },
    marketSentiment: 'neutral',
    volatilityIndex: 18.45,
    source: 'mock_data',
    lastUpdated: new Date().toISOString()
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    const fredApiKey = Deno.env.get('FRED_API_KEY');

    if (!alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not configured, using mock data');
      const mockOverview = getMockMarketOverview();
      
      return new Response(JSON.stringify(mockOverview), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Fetching market overview data...');

    // Fetch market indices data in parallel
    const [sp500Data, nasdaqData, dowData, sectorsData, vixData] = await Promise.allSettled([
      fetchAlphaVantageQuote('SPY', alphaVantageApiKey), // S&P 500 ETF
      fetchAlphaVantageQuote('QQQ', alphaVantageApiKey), // NASDAQ ETF
      fetchAlphaVantageQuote('DIA', alphaVantageApiKey), // Dow Jones ETF
      fetchSectorPerformance(alphaVantageApiKey),
      fetchVIXData(alphaVantageApiKey)
    ]);

    // Extract index data
    const indices = {
      sp500: extractIndexData(sp500Data.status === 'fulfilled' ? sp500Data.value : null),
      nasdaq: extractIndexData(nasdaqData.status === 'fulfilled' ? nasdaqData.value : null),
      dow: extractIndexData(dowData.status === 'fulfilled' ? dowData.value : null),
    };

    const sectors = sectorsData.status === 'fulfilled' ? sectorsData.value : getMockSectorData();
    const vix = vixData.status === 'fulfilled' ? vixData.value : null;

    // Fetch economic indicators if FRED API key is available
    let economicIndicators;
    if (fredApiKey) {
      console.log('Fetching economic indicators from FRED...');
      const [interestRateData, cpiData, unemploymentData] = await Promise.allSettled([
        fetchFREDData('FEDFUNDS', fredApiKey), // Federal Funds Rate
        fetchFREDData('CPIAUCSL', fredApiKey), // Consumer Price Index
        fetchFREDData('UNRATE', fredApiKey)    // Unemployment Rate
      ]);

      economicIndicators = {
        interestRate: interestRateData.status === 'fulfilled' ? interestRateData.value : undefined,
        cpi: cpiData.status === 'fulfilled' ? cpiData.value : undefined,
        unemployment: unemploymentData.status === 'fulfilled' ? unemploymentData.value : undefined
      };
    }

    // Calculate Fear & Greed Index
    const fearGreedIndex = calculateFearGreedIndex(
      indices.sp500.changePercent,
      vix?.value || 20,
      50 // Default volume metric
    );

    const marketOverview: MarketOverviewResponse = {
      indices,
      sectors,
      economicIndicators,
      fearGreedIndex,
      vix: vix || {
        value: 20,
        status: 'moderate',
        interpretation: 'Moderate volatility - normal market conditions'
      },
      marketSentiment: calculateMarketSentiment([indices.sp500, indices.nasdaq, indices.dow]),
      volatilityIndex: vix?.value || 20,
      source: 'alpha_vantage',
      lastUpdated: new Date().toISOString()
    };

    console.log(`Market overview generated successfully`);
    
    return new Response(JSON.stringify(marketOverview), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Market overview function error:', error.message);
    
    // Return mock data as fallback
    const mockOverview = getMockMarketOverview();
    
    return new Response(JSON.stringify(mockOverview), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
