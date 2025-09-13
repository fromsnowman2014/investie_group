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

async function getAlphaVantageQuote(symbol: string, apiKey: string): Promise<AlphaVantageQuote | null> {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Alpha Vantage API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`No quote data returned for ${symbol}`);
      return null;
    }

    return quote;
  } catch (error) {
    console.error(`Alpha Vantage quote API error for ${symbol}:`, error.message);
    return null;
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

function getMockStockData(symbol: string): StockPriceData {
  const basePrice = MOCK_PRICES[symbol] || 100;
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

    const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;

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
      };

      console.log(`Fetched fresh stock data for ${upperSymbol} from Alpha Vantage`);
      
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
