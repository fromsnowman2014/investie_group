// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface StockDataRecord {
  symbol: string;
  price: number;
  change_amount: number;
  change_percent: number;
  market_cap?: number;
  volume?: number;
  pe_ratio?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  data_source: string;
}

interface AIAnalysisRecord {
  symbol: string;
  rating: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  summary: string;
  key_factors: string[];
  analysis_date: string;
  ai_source: string;
}

// New interfaces for market indicators caching
interface MarketIndicatorRecord {
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  expires_at?: string;
  is_active?: boolean;
}

interface EconomicIndicatorRecord {
  indicator_name: string;
  current_value: number;
  previous_value?: number;
  change_percent?: number;
  trend?: 'up' | 'down' | 'stable';
  data_source: string;
  data_date: string;
}

interface MarketIndicatorCollectionJob {
  indicators: IndicatorType[];
  frequency: 'hourly' | 'daily' | 'weekly';
  retryConfig: RetryConfig;
  cacheConfig: CacheConfig;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

interface CacheConfig {
  maxAgeHours: number;
  staleWhileRevalidateHours: number;
}

// Define indicator types to collect
enum IndicatorType {
  FEAR_GREED_INDEX = 'fear_greed',
  VIX_VOLATILITY = 'vix',
  TREASURY_10Y = 'treasury_10y',
  CPI_INFLATION = 'cpi',
  UNEMPLOYMENT = 'unemployment',
  SP500_INDEX = 'sp500',
  NASDAQ_INDEX = 'nasdaq',
  SECTOR_PERFORMANCE = 'sectors'
}

interface CollectionResult {
  success: boolean;
  collected: number;
  errors: string[];
  timestamp: string;
}

const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC'
];

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://fwnmnjwtbggasmunsfyk.supabase.co'
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not configured');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY configured, length:', supabaseServiceKey.length);
}

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Service Key prefix:', supabaseServiceKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchStockDataFromAlphaVantage(symbol: string): Promise<StockDataRecord | null> {
  try {
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      console.warn('Alpha Vantage API key not found');
      return null;
    }

    console.log(`📊 Fetching Alpha Vantage data for ${symbol}...`);

    // Fetch quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      console.error(`Alpha Vantage quote API error: ${quoteResponse.status}`);
      return null;
    }

    const quoteData = await quoteResponse.json();
    const quote = quoteData['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`No quote data returned for ${symbol}`);
      return null;
    }

    // Fetch overview data 
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    const overviewResponse = await fetch(overviewUrl);
    
    if (!overviewResponse.ok) {
      console.error(`Alpha Vantage overview API error: ${overviewResponse.status}`);
      return null;
    }

    const overview = await overviewResponse.json();

    if (!overview.Symbol) {
      console.warn(`No overview data returned for ${symbol}`);
      return null;
    }

    // Parse market cap
    const parseMarketCap = (marketCapString: string): number | null => {
      if (!marketCapString || marketCapString === 'None') return null;
      const cleanString = marketCapString.replace(/[^0-9.]/g, '');
      const value = parseFloat(cleanString);
      if (marketCapString.includes('T')) return value * 1e12;
      if (marketCapString.includes('B')) return value * 1e9;
      if (marketCapString.includes('M')) return value * 1e6;
      return value;
    };

    const stockData: StockDataRecord = {
      symbol: symbol,
      price: parseFloat(quote['05. price']) || 0,
      change_amount: parseFloat(quote['09. change']) || 0,
      change_percent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
      market_cap: parseMarketCap(overview.MarketCapitalization),
      volume: parseInt(quote['06. volume']) || null,
      pe_ratio: parseFloat(overview.PERatio) || null,
      fifty_two_week_high: parseFloat(overview['52WeekHigh']) || null,
      fifty_two_week_low: parseFloat(overview['52WeekLow']) || null,
      data_source: 'alpha_vantage'
    };

    console.log(`✅ Stock data fetched for ${symbol}: $${stockData.price}`);
    return stockData;

  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    return null;
  }
}

async function generateAIAnalysisWithClaude(symbol: string): Promise<AIAnalysisRecord | null> {
  try {
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      console.warn('Claude API key not found');
      return null;
    }

    console.log(`🤖 Generating AI analysis for ${symbol}...`);

    const prompt = `As a senior investment analyst, provide a comprehensive evaluation of ${symbol} stock. 
    Consider recent market conditions, company fundamentals, industry trends, and macroeconomic factors.
    Rate the stock as bullish, neutral, or bearish with a confidence level (0-100).
    Provide specific key factors that support your analysis.
    Give a clear BUY/HOLD/SELL recommendation based on current conditions.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `${prompt}\\n\\nRespond with valid JSON matching this schema:
          {
            "rating": "bullish|neutral|bearish",
            "confidence": 85,
            "summary": "2-3 sentence analysis",
            "keyFactors": ["factor1", "factor2", "factor3"],
            "recommendation": "BUY|HOLD|SELL"
          }`
        }]
      })
    });

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.warn('No content returned from Claude API');
      return null;
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      
      const aiAnalysis: AIAnalysisRecord = {
        symbol: symbol,
        rating: analysisData.rating,
        confidence: analysisData.confidence,
        recommendation: analysisData.recommendation,
        summary: analysisData.summary,
        key_factors: analysisData.keyFactors,
        analysis_date: new Date().toISOString(),
        ai_source: 'claude'
      };

      console.log(`✅ AI analysis generated for ${symbol}: ${aiAnalysis.rating} (${aiAnalysis.confidence}%)`);
      return aiAnalysis;
    }

    return null;

  } catch (error) {
    console.error(`Error generating AI analysis for ${symbol}:`, error.message);
    return null;
  }
}

async function saveStockDataToDatabase(stockData: StockDataRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stock_data')
      .insert(stockData);

    if (error) {
      console.error(`Database insert error for stock_data:`, error.message);
      return false;
    }

    console.log(`✅ Stock data saved to database: ${stockData.symbol}`);
    return true;

  } catch (error) {
    console.error(`Database save error for stock_data:`, error.message);
    return false;
  }
}

async function saveAIAnalysisToDatabase(aiAnalysis: AIAnalysisRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_analysis')
      .insert(aiAnalysis);

    if (error) {
      console.error(`Database insert error for ai_analysis:`, error.message);
      return false;
    }

    console.log(`✅ AI analysis saved to database: ${aiAnalysis.symbol}`);
    return true;

  } catch (error) {
    console.error(`Database save error for ai_analysis:`, error.message);
    return false;
  }
}

// Market Indicators Collection Functions

// Utility function for retrying API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Rate limiting helper
class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number;

  constructor(callsPerSecond: number) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCall = Date.now();
  }
}

// Rate limiters for different APIs
const fredRateLimiter = new RateLimiter(0.2); // 5 calls per second max for FRED
const alphaVantageRateLimiter = new RateLimiter(0.2); // 5 calls per second max for Alpha Vantage

async function collectEconomicIndicators(): Promise<MarketIndicatorRecord[]> {
  const results: MarketIndicatorRecord[] = [];
  const fredApiKey = Deno.env.get('FRED_API_KEY');

  if (!fredApiKey) {
    console.warn('⚠️ FRED API key not found, skipping economic indicators');
    return results;
  }

  console.log('📊 Collecting economic indicators from FRED...');

  // Economic indicators to collect
  const indicators = [
    { series: 'DGS10', type: IndicatorType.TREASURY_10Y, name: '10-Year Treasury Rate' },
    { series: 'UNRATE', type: IndicatorType.UNEMPLOYMENT, name: 'Unemployment Rate' },
    { series: 'CPIAUCSL', type: IndicatorType.CPI_INFLATION, name: 'Consumer Price Index' }
  ];

  for (const indicator of indicators) {
    try {
      await fredRateLimiter.wait(); // Apply rate limiting

      const fetchData = async () => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.series}&api_key=${fredApiKey}&file_type=json&limit=2&sort_order=desc`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Investie-Data-Collector/1.0'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`FRED API error for ${indicator.series}: ${response.status}`);
        }

        return await response.json();
      };

      const data = await retryWithBackoff(fetchData, 3, 1000);
      if (data.observations && data.observations.length > 0) {
        const latest = data.observations[0];
        const previous = data.observations[1];

        // Validate data
        if (latest.value === '.' || isNaN(parseFloat(latest.value))) {
          console.warn(`⚠️ Invalid data for ${indicator.name}: ${latest.value}`);
          continue;
        }

        const currentValue = parseFloat(latest.value);
        const previousValue = previous && previous.value !== '.' ? parseFloat(previous.value) : null;
        const changePercent = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : null;

        const marketIndicator: MarketIndicatorRecord = {
          indicator_type: indicator.type,
          data_value: {
            value: currentValue,
            date: latest.date,
            previous_value: previousValue,
            change_percent: changePercent,
            trend: changePercent ? (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable') : 'stable'
          },
          metadata: {
            series_id: indicator.series,
            name: indicator.name,
            units: data.units || 'Percent'
          },
          data_source: 'fred',
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
          is_active: true
        };

        results.push(marketIndicator);
        console.log(`✅ Collected ${indicator.name}: ${currentValue}%`);
      } else {
        console.warn(`⚠️ No data available for ${indicator.name}`);
      }
    } catch (error) {
      console.error(`❌ Error collecting ${indicator.name}:`, error.message);
    }
  }

  return results;
}

async function collectMarketIndicators(): Promise<MarketIndicatorRecord[]> {
  const results: MarketIndicatorRecord[] = [];
  const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

  if (!alphaVantageKey) {
    console.warn('⚠️ Alpha Vantage API key not found, skipping market indicators');
    return results;
  }

  console.log('📈 Collecting market indicators from Alpha Vantage...');

  // Collect S&P 500 data
  try {
    await alphaVantageRateLimiter.wait(); // Apply rate limiting

    const fetchSP500 = async () => {
      const sp500Url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${alphaVantageKey}`;
      const response = await fetch(sp500Url, {
        headers: {
          'User-Agent': 'Investie-Data-Collector/1.0'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error for SPY: ${response.status}`);
      }

      return await response.json();
    };

    const data = await retryWithBackoff(fetchSP500, 3, 1000);
    const quote = data['Global Quote'];

    if (quote && Object.keys(quote).length > 0) {
      const marketIndicator: MarketIndicatorRecord = {
        indicator_type: IndicatorType.SP500_INDEX,
        data_value: {
          symbol: 'SPY',
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          timestamp: quote['07. latest trading day']
        },
        metadata: {
          name: 'S&P 500 ETF (SPY)',
          exchange: 'NYSE'
        },
        data_source: 'alpha_vantage',
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        is_active: true
      };

      results.push(marketIndicator);
      console.log(`✅ Collected S&P 500: $${marketIndicator.data_value.price}`);
    } else {
      console.warn('⚠️ No S&P 500 data available');
    }
  } catch (error) {
    console.error('Error collecting S&P 500 data:', error.message);
  }

  // Collect VIX data
  try {
    await alphaVantageRateLimiter.wait(); // Apply rate limiting

    const fetchVIX = async () => {
      const vixUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VIX&apikey=${alphaVantageKey}`;
      const response = await fetch(vixUrl, {
        headers: {
          'User-Agent': 'Investie-Data-Collector/1.0'
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error for VIX: ${response.status}`);
      }

      return await response.json();
    };

    const data = await retryWithBackoff(fetchVIX, 3, 1000);
    const quote = data['Global Quote'];

    if (quote && Object.keys(quote).length > 0) {
      const vixValue = parseFloat(quote['05. price']);
      let volatilityLevel = 'normal';
      if (vixValue > 30) volatilityLevel = 'high';
      else if (vixValue > 20) volatilityLevel = 'elevated';
      else if (vixValue < 12) volatilityLevel = 'low';

      const marketIndicator: MarketIndicatorRecord = {
        indicator_type: IndicatorType.VIX_VOLATILITY,
        data_value: {
          value: vixValue,
          change: parseFloat(quote['09. change']),
          change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
          level: volatilityLevel,
          timestamp: quote['07. latest trading day']
        },
        metadata: {
          name: 'CBOE Volatility Index',
          description: 'Market volatility indicator'
        },
        data_source: 'alpha_vantage',
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        is_active: true
      };

      results.push(marketIndicator);
      console.log(`✅ Collected VIX: ${vixValue} (${volatilityLevel})`);
    } else {
      console.warn('⚠️ No VIX data available');
    }
  } catch (error) {
    console.error('Error collecting VIX data:', error.message);
  }

  return results;
}

async function collectSentimentIndicators(): Promise<MarketIndicatorRecord[]> {
  const results: MarketIndicatorRecord[] = [];

  console.log('😱 Collecting sentiment indicators...');

  // Collect Fear & Greed Index
  try {
    const fetchFearGreed = async () => {
      const fearGreedUrl = 'https://api.alternative.me/fng/';
      const response = await fetch(fearGreedUrl, {
        headers: {
          'User-Agent': 'Investie-Data-Collector/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Alternative.me API error: ${response.status}`);
      }

      return await response.json();
    };

    const data = await retryWithBackoff(fetchFearGreed, 3, 1000);
    if (data.data && data.data.length > 0) {
      const latest = data.data[0];

      const marketIndicator: MarketIndicatorRecord = {
        indicator_type: IndicatorType.FEAR_GREED_INDEX,
        data_value: {
          value: parseInt(latest.value),
          classification: latest.value_classification,
          timestamp: latest.timestamp,
          time_until_update: latest.time_until_update
        },
        metadata: {
          name: 'Fear & Greed Index',
          source: 'Alternative.me',
          description: 'Market sentiment indicator (0-100)'
        },
        data_source: 'alternative_me',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true
      };

      results.push(marketIndicator);
      console.log(`✅ Collected Fear & Greed Index: ${latest.value} (${latest.value_classification})`);
    } else {
      console.warn('⚠️ No Fear & Greed Index data available');
    }
  } catch (error) {
    console.error('Error collecting Fear & Greed Index:', error.message);
  }

  return results;
}

async function saveMarketIndicators(indicators: MarketIndicatorRecord[]): Promise<boolean> {
  if (indicators.length === 0) return true;

  try {
    console.log(`🔄 Attempting to save ${indicators.length} indicators to market_indicators_cache`);
    console.log('📊 Sample indicator:', JSON.stringify(indicators[0], null, 2));
    
    // Log all indicators for debugging
    for (let i = 0; i < indicators.length; i++) {
      console.log(`📋 Indicator ${i}:`, JSON.stringify(indicators[i], null, 2));
    }
    
    const { data, error } = await supabase
      .from('market_indicators_cache')
      .insert(indicators)
      .select();

        if (error) {
          console.error('❌ Database insert error for market_indicators_cache:');
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          
          // Try to insert each indicator individually to find the problematic one
          console.log('🔍 Trying individual inserts to identify problematic data...');
          for (let i = 0; i < indicators.length; i++) {
            try {
              const { error: singleError } = await supabase
                .from('market_indicators_cache')
                .insert([indicators[i]])
                .select();
              
              if (singleError) {
                console.error(`❌ Error with indicator ${i}:`, JSON.stringify(indicators[i], null, 2));
                console.error(`Single insert error:`, singleError.message);
              } else {
                console.log(`✅ Indicator ${i} inserted successfully`);
              }
            } catch (singleException) {
              console.error(`💥 Exception with indicator ${i}:`, singleException.message);
            }
          }
          
          return false;
        }

    console.log(`✅ Successfully saved ${indicators.length} market indicators to database`);
    console.log('📊 Saved data sample:', JSON.stringify(data?.[0], null, 2));
    return true;

  } catch (error) {
    console.error('💥 Database save exception for market_indicators_cache:', error.message);
    return false;
  }
}

async function collectAllMarketIndicators(): Promise<CollectionResult> {
  const results: MarketIndicatorRecord[] = [];
  const errors: string[] = [];

  console.log('🚀 Starting comprehensive market indicators collection...');

  try {
    // 1. Collect economic indicators (FRED API)
    const economicIndicators = await collectEconomicIndicators();
    results.push(...economicIndicators);
    console.log(`📊 Economic indicators collected: ${economicIndicators.length}`);
  } catch (error) {
    const errorMsg = `Economic indicators collection failed: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // 2. Collect market indicators (Alpha Vantage)
    const marketIndicators = await collectMarketIndicators();
    results.push(...marketIndicators);
    console.log(`📈 Market indicators collected: ${marketIndicators.length}`);
  } catch (error) {
    const errorMsg = `Market indicators collection failed: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // 3. Collect sentiment indicators (Alternative.me)
    const sentimentIndicators = await collectSentimentIndicators();
    results.push(...sentimentIndicators);
    console.log(`😱 Sentiment indicators collected: ${sentimentIndicators.length}`);
  } catch (error) {
    const errorMsg = `Sentiment indicators collection failed: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  // 4. Save all indicators to database
  try {
    await saveMarketIndicators(results);
  } catch (error) {
    const errorMsg = `Database save failed: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  const collectionResult: CollectionResult = {
    success: errors.length === 0,
    collected: results.length,
    errors: errors,
    timestamp: new Date().toISOString()
  };

  console.log(`✅ Market indicators collection completed: ${collectionResult.collected} indicators collected, ${errors.length} errors`);

  return collectionResult;
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
    const { action, symbols, source } = await req.json();

    if (action === 'collect_all') {
      // New comprehensive market indicators collection
      console.log(`🚀 Starting comprehensive data collection (source: ${source || 'manual'})`);

      const result = await collectAllMarketIndicators();

      return new Response(JSON.stringify({
        ...result,
        source: source || 'manual',
        message: `Collected ${result.collected} indicators with ${result.errors.length} errors`
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else if (action === 'collect') {
      const symbolList = symbols || VALID_SYMBOLS.slice(0, 2); // Limit to 2 for testing
      const results = [];

      console.log(`🚀 Starting data collection for symbols: ${symbolList.join(', ')}`);

      for (const symbol of symbolList) {
        console.log(`🔄 Processing ${symbol}...`);
        
        // Fetch and save stock data
        const stockData = await fetchStockDataFromAlphaVantage(symbol);
        if (stockData) {
          await saveStockDataToDatabase(stockData);
          results.push({ symbol, stockData: true });
        } else {
          results.push({ symbol, stockData: false });
        }

        // Fetch and save AI analysis
        const aiAnalysis = await generateAIAnalysisWithClaude(symbol);
        if (aiAnalysis) {
          await saveAIAnalysisToDatabase(aiAnalysis);
          results[results.length - 1].aiAnalysis = true;
        } else {
          results[results.length - 1].aiAnalysis = false;
        }

        // Rate limiting - 3 second delay between symbols
        if (symbolList.indexOf(symbol) < symbolList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      const summary = {
        timestamp: new Date().toISOString(),
        processed: symbolList.length,
        successful: results.filter(r => r.stockData).length,
        results: results
      };

      console.log(`✅ Data collection completed: ${summary.successful}/${summary.processed} successful`);

      return new Response(JSON.stringify(summary), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else if (action === 'health') {
      // Health check
      console.log(`🔑 Service Role Key status: ${supabaseServiceKey ? 'FOUND' : 'NOT FOUND'}`);
      
      const { data, error } = await supabase
        .from('stock_data')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error.message);
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use "collect_all", "collect", or "health"' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Data collector function error:', error.message);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
