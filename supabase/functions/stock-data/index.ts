// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface StockPriceData {
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  pe?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  source: string;
  // API Rate Limit Information
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
    availableTomorrow?: boolean;
  };
}

interface AlphaVantageQuote {
  '05. price': string;
  '09. change': string;
  '10. change percent': string;
  '06. volume': string;
}

interface AlphaVantageOverview {
  Symbol: string;
  MarketCapitalization: string;
  PERatio: string;
  '52WeekHigh': string;
  '52WeekLow': string;
}

const VALID_SYMBOLS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
  'META', 'NFLX', 'AVGO', 'AMD', 'JPM', 'BAC', 
  'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
];


function validateSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.includes(symbol.toUpperCase());
}

async function getAlphaVantageQuote(symbol: string, apiKey: string): Promise<{ data: AlphaVantageQuote | null; isRateLimited: boolean; rateLimitMessage?: string }> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    console.log(`🔍 Fetching Alpha Vantage quote for ${symbol}...`);
    console.log(`🔗 URL: ${url.replace(apiKey, 'HIDDEN_KEY')}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log(`📡 Alpha Vantage response for ${symbol}: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.warn(`Alpha Vantage API error: ${response.status}`);
      return { data: null, isRateLimited: false };
    }

    const data = await response.json();
    console.log(`📦 Alpha Vantage raw data for ${symbol}:`, JSON.stringify(data));
    
    // Enhanced rate limit detection
    if (data.Information) {
      console.log(`ℹ️ Alpha Vantage Information field: ${data.Information}`);
      
      // Check for various rate limit messages
      const rateLimitPatterns = [
        'rate limit',
        'API call frequency',
        'calls per day',
        'calls per minute',
        'upgrade your API key',
        'Thank you for using Alpha Vantage'
      ];
      
      const isRateLimited = rateLimitPatterns.some(pattern => 
        data.Information.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isRateLimited) {
        console.warn(`⚠️ API Rate limit detected for ${symbol}: ${data.Information}`);
        return { 
          data: null, 
          isRateLimited: true, 
          rateLimitMessage: 'Daily API rate limit reached. Stock data temporarily unavailable.'
        };
      }
    }
    
    // Check for Note field (another common rate limit indicator)
    if (data.Note && data.Note.toLowerCase().includes('rate limit')) {
      console.warn(`⚠️ API Rate limit detected in Note field for ${symbol}: ${data.Note}`);
      return { 
        data: null, 
        isRateLimited: true, 
        rateLimitMessage: 'Daily API rate limit reached. Stock data temporarily unavailable.'
      };
    }

    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`❌ No Global Quote data found for ${symbol}. Response keys:`, Object.keys(data));
      console.warn(`🚨 This might indicate rate limiting or API issues`);
      
      // If we get empty response or no data, assume it's rate limited
      if (Object.keys(data).length === 0 || (!data['Global Quote'] && !data.Information && !data.Note)) {
        console.warn(`⚠️ Empty response detected for ${symbol}, assuming rate limit`);
        return { 
          data: null, 
          isRateLimited: true, 
          rateLimitMessage: "Daily API rate limit reached. Stock data temporarily unavailable."
        };
      }
      
      return { data: null, isRateLimited: false };
    } else {
      console.log(`✅ Successfully parsed Global Quote for ${symbol}`);
    }

    return { data: quote, isRateLimited: false };
  } catch (error) {
    console.error(`❌ Error fetching ${symbol} data:`, error.message);
    return { data: null, isRateLimited: false };
  }
}

async function getAlphaVantageOverview(symbol: string, apiKey: string): Promise<AlphaVantageOverview | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Alpha Vantage Overview API error: ${response.status}`);
      return null;
    }

    const overview = await response.json();
    
    if (!overview || overview.Symbol !== symbol) {
      console.warn(`No overview data returned for ${symbol}`);
      return null;
    }

    return overview;
  } catch (error) {
    console.error(`Alpha Vantage overview API error for ${symbol}:`, error.message);
    return null;
  }
}

function parseMarketCap(marketCapString: string): number {
  if (!marketCapString || marketCapString === 'None') return 0;

  const cleanString = marketCapString.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleanString);

  if (marketCapString.includes('T')) {
    return value * 1e12;
  } else if (marketCapString.includes('B')) {
    return value * 1e9;
  } else if (marketCapString.includes('M')) {
    return value * 1e6;
  }

  return value;
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
    const { symbol } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const upperSymbol = symbol.toUpperCase();
    
    if (!validateSymbol(upperSymbol)) {
      return new Response(JSON.stringify({ error: `Invalid stock symbol: ${symbol}` }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get API key from environment variables
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    console.log('🔑 Alpha Vantage API Key status:', alphaVantageApiKey ? 'CONFIGURED' : 'MISSING');
    
    if (!alphaVantageApiKey) {
      console.error('Alpha Vantage API key not configured');
      
      return new Response(JSON.stringify({
        error: 'API_KEY_MISSING',
        message: `Alpha Vantage API key is required for ${upperSymbol} stock data`,
        details: 'Please configure ALPHA_VANTAGE_API_KEY environment variable',
        errorType: 'CONFIGURATION_ERROR',
        symbol: upperSymbol
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fetch real-time data from Alpha Vantage
    console.log('📊 Starting Alpha Vantage API calls for', upperSymbol);
    const [quoteResult, overviewResult] = await Promise.allSettled([
      getAlphaVantageQuote(upperSymbol, alphaVantageApiKey),
      getAlphaVantageOverview(upperSymbol, alphaVantageApiKey),
    ]);

    console.log('📊 Quote Result:', quoteResult.status, quoteResult.status === 'rejected' ? quoteResult.reason : 'Success');
    console.log('📊 Overview Result:', overviewResult.status, overviewResult.status === 'rejected' ? overviewResult.reason : 'Success');

    const quoteResponse = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
    const quote = quoteResponse?.data;

    // Check for rate limiting
    let rateLimitInfo: {
      isLimited: boolean;
      message?: string;
      resetTime?: string;
      availableTomorrow?: boolean;
    } | undefined = undefined;

    if (quoteResponse?.isRateLimited) {
      rateLimitInfo = {
        isLimited: true,
        message: quoteResponse.rateLimitMessage,
        resetTime: 'Tomorrow (UTC)',
        availableTomorrow: true
      };
    }

    if (quote && overview) {
      const stockData: StockPriceData = {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        marketCap: parseMarketCap(overview.MarketCapitalization),
        volume: parseInt(quote['06. volume']),
        pe: parseFloat(overview.PERatio) || undefined,
        fiftyTwoWeekHigh: parseFloat(overview['52WeekHigh']),
        fiftyTwoWeekLow: parseFloat(overview['52WeekLow']),
        source: 'alpha_vantage',
        alphaVantageRateLimit: rateLimitInfo
      };

      console.log(`Fetched fresh stock data for ${upperSymbol} from Alpha Vantage`);
      
      return new Response(JSON.stringify(stockData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // If we detected rate limiting, include that info even with mock data
    if (rateLimitInfo) {
      console.warn(`Alpha Vantage API rate limited for ${upperSymbol}, using mock data with warning`);
      const stockData = {
        ...getMockStockData(upperSymbol),
        alphaVantageRateLimit: rateLimitInfo
      };
      
      return new Response(JSON.stringify(stockData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.warn(`Alpha Vantage API failed for ${upperSymbol}, using mock data`);
    const stockData = getMockStockData(upperSymbol);
    
    return new Response(JSON.stringify(stockData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Stock data function error:', error.message);
    
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
