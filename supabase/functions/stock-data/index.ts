// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { trackApiCall } from '../_shared/api-usage-tracker.ts';

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

const MOCK_PRICES: Record<string, number> = {
  AAPL: 182.52,
  TSLA: 245.83,
  MSFT: 378.24,
  GOOGL: 138.93,
  AMZN: 146.8,
  NVDA: 685.32,
  META: 298.57,
  NFLX: 456.78,
  AVGO: 892.13,
  AMD: 143.29,
  JPM: 142.50,
  BAC: 32.15,
  JNJ: 168.75,
  PFE: 28.90,
  SPY: 445.20,
  QQQ: 375.80,
  VTI: 234.60
};

function validateSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.includes(symbol.toUpperCase());
}

async function getAlphaVantageQuote(symbol: string, apiKey: string): Promise<{ data: AlphaVantageQuote | null; isRateLimited: boolean; rateLimitMessage?: string }> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    console.log(`🔍 Fetching Alpha Vantage quote for ${symbol}...`);
    console.log(`🔗 URL: ${url.replace(apiKey, 'HIDDEN_KEY')}`);

    const data = await trackApiCall(
      'alpha_vantage',
      url,
      'stock-data',
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Alpha Vantage response for ${symbol}: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`Alpha Vantage API error: ${response.status}`);
        }

        return await response.json();
      },
      {
        indicatorType: 'stock_quote',
        apiKey: apiKey
      }
    );
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

    const overview = await trackApiCall(
      'alpha_vantage',
      url,
      'stock-data',
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Alpha Vantage Overview API error: ${response.status}`);
        }

        return await response.json();
      },
      {
        indicatorType: 'stock_overview',
        apiKey: apiKey
      }
    );
    
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

function getMockStockData(symbol: string): StockPriceData {
  // Use predefined prices for known symbols, otherwise generate dynamic price based on symbol hash
  let basePrice = MOCK_PRICES[symbol];

  if (!basePrice) {
    // Generate consistent price based on symbol hash (so same symbol always gets same base price)
    const hashCode = symbol.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Generate price between $10-$500 based on hash
    basePrice = Math.abs(hashCode % 490) + 10;
  }

  const change = (Math.random() - 0.5) * 10;
  const changePercent = (change / basePrice) * 100;

  return {
    price: basePrice + change,
    change,
    changePercent,
    pe: 15 + Math.random() * 20,
    marketCap: Math.random() * 2000000000000,
    volume: Math.random() * 50000000,
    fiftyTwoWeekHigh: basePrice * 1.2,
    fiftyTwoWeekLow: basePrice * 0.8,
    source: 'mock_data',
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

    // Symbol validation removed - now accepts any stock symbol for broader market coverage
    // This allows users to search and get data for all NYSE/NASDAQ stocks

    // Get API key from environment variables
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    console.log('🔑 Alpha Vantage API Key status:', alphaVantageApiKey ? 'CONFIGURED' : 'MISSING');
    
    if (!alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not configured, using mock data');
      const stockData = getMockStockData(upperSymbol);
      
      return new Response(JSON.stringify(stockData), {
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
