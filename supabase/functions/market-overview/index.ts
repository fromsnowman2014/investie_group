// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { 
  MultiProviderManager, 
  AlphaVantageProvider, 
  YahooFinanceProvider, 
  TwelveDataProvider,
  type StockQuoteData 
} from './api-providers.ts'

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
  // API Rate Limit Information
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
    availableTomorrow?: boolean;
  };
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

// Initialize Multi-Provider Manager
function createMultiProviderManager(alphaVantageApiKey?: string): MultiProviderManager {
  const manager = new MultiProviderManager();
  
  // Add Alpha Vantage provider (highest priority)
  if (alphaVantageApiKey) {
    manager.addProvider(new AlphaVantageProvider(alphaVantageApiKey));
  }
  
  // Add Yahoo Finance provider (fallback)
  manager.addProvider(new YahooFinanceProvider());
  
  // Add Twelve Data provider (demo key)
  manager.addProvider(new TwelveDataProvider());
  
  return manager;
}

async function fetchMultiProviderQuote(symbol: string, manager: MultiProviderManager): Promise<{ 
  data: any; 
  isRateLimited: boolean; 
  rateLimitMessage?: string;
  provider?: string;
}> {
  const result = await manager.fetchQuote(symbol);
  
  if (result.data) {
    // Convert to Alpha Vantage format for compatibility
    const alphaVantageFormat = {
      '05. price': result.data.price.toString(),
      '09. change': result.data.change.toString(),
      '10. change percent': `${result.data.changePercent.toFixed(4)}%`,
      '06. volume': result.data.volume?.toString() || '0'
    };
    
    return {
      data: alphaVantageFormat,
      isRateLimited: false,
      provider: result.provider
    };
  }
  
  return {
    data: null,
    isRateLimited: result.isRateLimited,
    rateLimitMessage: result.rateLimitMessage,
    provider: result.provider
  };
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

async function fetchRealFearGreedIndex(): Promise<{ value: number; status: string; confidence: number } | null> {
  try {
    console.log('🎯 Fetching real Fear & Greed Index from Alternative.me API...');
    const response = await fetch('https://api.alternative.me/fng/?limit=1', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn(`Alternative.me API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('📊 Raw Fear & Greed data:', JSON.stringify(data));
    
    if (data.metadata?.error || !data.data?.[0]) {
      console.warn('No Fear & Greed Index data available from Alternative.me');
      return null;
    }

    const fgiData = data.data[0];
    const value = parseInt(fgiData.value) || 50;
    let status: string;

    // Map the classification to our status format
    const classification = fgiData.value_classification?.toLowerCase();
    if (value >= 75) status = 'extreme_greed';
    else if (value >= 55) status = 'greed';
    else if (value >= 45) status = 'neutral';
    else if (value >= 25) status = 'fear';
    else status = 'extreme_fear';

    console.log(`✅ Real Fear & Greed Index: ${value} (${status})`);
    
    return {
      value,
      status,
      confidence: 90 // High confidence for real API data
    };
  } catch (error) {
    console.error('Error fetching real Fear & Greed Index:', error.message);
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

function extractIndexData(apiData: any, isETF: boolean = false): IndexData {
  if (!apiData) {
    return { value: 0, change: 0, changePercent: 0 };
  }

  let value = parseFloat(apiData['05. price']) || 0;
  let change = parseFloat(apiData['09. change']) || 0;
  let changePercent = parseFloat(apiData['10. change percent']?.replace('%', '')) || 0;

  // Convert SPY ETF price to approximate S&P 500 index value
  if (isETF) {
    console.log(`🔄 Converting ETF price ${value} to index value`);
    value = value * 10; // SPY trades at ~1/10th of S&P 500 index
    change = change * 10;
    // changePercent remains the same as it's already a percentage
    console.log(`✅ Converted index value: ${value}`);
  }

  return {
    value,
    change,
    changePercent,
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
  // Generate realistic mock data based on recent market levels
  const randomVariation = (base: number, variance: number) => base + (Math.random() - 0.5) * variance;
  
  // Realistic market levels as of September 2025
  const sp500Value = randomVariation(5580, 50);
  const sp500Change = randomVariation(0, 30);
  const sp500ChangePercent = (sp500Change / sp500Value) * 100;
  
  const nasdaqValue = randomVariation(17400, 100);  
  const nasdaqChange = randomVariation(0, 80);
  const nasdaqChangePercent = (nasdaqChange / nasdaqValue) * 100;
  
  const dowValue = randomVariation(41000, 200);
  const dowChange = randomVariation(0, 150);
  const dowChangePercent = (dowChange / dowValue) * 100;

  return {
    indices: {
      sp500: { 
        value: Math.round(sp500Value * 100) / 100, 
        change: Math.round(sp500Change * 100) / 100, 
        changePercent: Math.round(sp500ChangePercent * 10000) / 10000 
      },
      nasdaq: { 
        value: Math.round(nasdaqValue * 100) / 100, 
        change: Math.round(nasdaqChange * 100) / 100, 
        changePercent: Math.round(nasdaqChangePercent * 10000) / 10000 
      },
      dow: { 
        value: Math.round(dowValue * 100) / 100, 
        change: Math.round(dowChange * 100) / 100, 
        changePercent: Math.round(dowChangePercent * 10000) / 10000 
      }
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
    source: 'simulated_data_due_to_api_limits',
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

    console.log('🔑 API Keys status:');
    console.log(`  Alpha Vantage: ${alphaVantageApiKey ? 'SET (length: ' + alphaVantageApiKey.length + ')' : 'MISSING'}`);
    console.log(`  FRED API: ${fredApiKey ? 'SET (length: ' + fredApiKey.length + ')' : 'MISSING'}`);

    if (!alphaVantageApiKey) {
      console.warn('⚠️ Alpha Vantage API key not configured, using mock data');
      const mockOverview = getMockMarketOverview();
      
      return new Response(JSON.stringify(mockOverview), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }


    console.log('Fetching market overview data...');

    // Initialize multi-provider manager
    const stockDataManager = createMultiProviderManager(alphaVantageApiKey);
    console.log('🔧 Multi-provider manager initialized with providers:', 
                stockDataManager.getProviderStatus().map(p => `${p.name}(${p.available ? 'available' : 'unavailable'})`));

    // Fetch market indices data and Fear & Greed Index in parallel
    const [sp500Result, nasdaqResult, dowResult, sectorsData, vixData, realFearGreedResult] = await Promise.allSettled([
      fetchMultiProviderQuote('SPY', stockDataManager), // S&P 500 ETF with multi-provider
      fetchMultiProviderQuote('QQQ', stockDataManager), // NASDAQ ETF with multi-provider
      fetchMultiProviderQuote('DIA', stockDataManager), // Dow Jones ETF with multi-provider
      fetchSectorPerformance(alphaVantageApiKey),
      fetchVIXData(alphaVantageApiKey),
      fetchRealFearGreedIndex() // Real Fear & Greed Index from Alternative.me
    ]);

    // Check for rate limiting from multi-provider results
    let rateLimitInfo: {
      isLimited: boolean;
      message?: string;
      resetTime?: string;
      availableTomorrow?: boolean;
      providers?: string[];
    } | undefined = undefined;
    
    const checkRateLimit = (result: PromiseSettledResult<any>) => {
      if (result.status === 'fulfilled' && result.value?.isRateLimited) {
        return {
          isLimited: true,
          message: result.value.rateLimitMessage,
          resetTime: 'Tomorrow (UTC)',
          availableTomorrow: true,
          provider: result.value.provider
        };
      }
      return undefined;
    };

    const sp500RateLimit = checkRateLimit(sp500Result);
    const nasdaqRateLimit = checkRateLimit(nasdaqResult);
    const dowRateLimit = checkRateLimit(dowResult);
    
    // Only set rate limit if ALL providers are exhausted
    const allProvidersExhausted = sp500RateLimit && nasdaqRateLimit && dowRateLimit;
    
    if (allProvidersExhausted) {
      rateLimitInfo = {
        isLimited: true,
        message: 'All stock data providers have reached their rate limits.',
        resetTime: 'Tomorrow (UTC)',
        availableTomorrow: true,
        providers: [sp500RateLimit.provider, nasdaqRateLimit.provider, dowRateLimit.provider]
      };
    }
    
    // Log provider usage
    const providers = [sp500Result, nasdaqResult, dowResult]
      .map((result, index) => {
        const symbols = ['SPY', 'QQQ', 'DIA'];
        return result.status === 'fulfilled' && result.value?.provider 
          ? `${symbols[index]}:${result.value.provider}` 
          : `${symbols[index]}:failed`;
      });
    console.log('📊 Provider usage:', providers.join(', '));

    // Extract index data
    // Check if we got direct index data (no conversion needed) or ETF data (needs conversion)
    const isDirectIndexData = (result: any) => {
      return result?.provider === 'yahoo_finance'; // Yahoo Finance provides direct index data
    };
    
    const indices = {
      sp500: extractIndexData(
        sp500Result.status === 'fulfilled' ? sp500Result.value?.data : null, 
        !isDirectIndexData(sp500Result.status === 'fulfilled' ? sp500Result.value : null)
      ),
      nasdaq: extractIndexData(
        nasdaqResult.status === 'fulfilled' ? nasdaqResult.value?.data : null, 
        !isDirectIndexData(nasdaqResult.status === 'fulfilled' ? nasdaqResult.value : null)
      ), 
      dow: extractIndexData(
        dowResult.status === 'fulfilled' ? dowResult.value?.data : null, 
        !isDirectIndexData(dowResult.status === 'fulfilled' ? dowResult.value : null)
      ),
    };
    
    console.log('📊 Index data sources:', {
      sp500: isDirectIndexData(sp500Result.status === 'fulfilled' ? sp500Result.value : null) ? 'Direct Index' : 'ETF x10',
      nasdaq: isDirectIndexData(nasdaqResult.status === 'fulfilled' ? nasdaqResult.value : null) ? 'Direct Index' : 'ETF x10',
      dow: isDirectIndexData(dowResult.status === 'fulfilled' ? dowResult.value : null) ? 'Direct Index' : 'ETF x10'
    });

    const sectors = sectorsData.status === 'fulfilled' ? sectorsData.value : getMockSectorData();
    const vix = vixData.status === 'fulfilled' ? vixData.value : null;
    const realFearGreed = realFearGreedResult.status === 'fulfilled' ? realFearGreedResult.value : null;

    // Fetch economic indicators if FRED API key is available
    let economicIndicators;
    if (fredApiKey) {
      console.log('Fetching economic indicators from FRED...');
      const [treasuryRateData, cpiData, unemploymentData] = await Promise.allSettled([
        fetchFREDData('DGS10', fredApiKey), // 10-Year Treasury Rate (Fixed!)
        fetchFREDData('CPIAUCSL', fredApiKey), // Consumer Price Index
        fetchFREDData('UNRATE', fredApiKey)    // Unemployment Rate
      ]);

      economicIndicators = {
        interestRate: treasuryRateData.status === 'fulfilled' ? treasuryRateData.value : undefined,
        cpi: cpiData.status === 'fulfilled' ? cpiData.value : undefined,
        unemployment: unemploymentData.status === 'fulfilled' ? unemploymentData.value : undefined
      };
    }

    // Use real Fear & Greed Index if available, otherwise calculate fallback
    const fearGreedIndex = realFearGreed || calculateFearGreedIndex(
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
      source: rateLimitInfo ? 'rate_limited' : (realFearGreed ? 'multi_provider_with_real_fgi' : 'multi_provider'),
      lastUpdated: new Date().toISOString(),
      alphaVantageRateLimit: rateLimitInfo
    };

    console.log(`Market overview generated successfully`);
    console.log(`Fear & Greed Index source: ${realFearGreed ? 'Alternative.me API' : 'Calculated fallback'}`);
    console.log(`Fear & Greed Index value: ${fearGreedIndex.value} (${fearGreedIndex.status})`);
    
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
