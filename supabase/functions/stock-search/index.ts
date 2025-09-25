// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface StockSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  price?: number;
}

interface StockSearchResponse {
  results: StockSearchResult[];
  query: string;
  total: number;
  source: string;
}

interface FMPStockItem {
  symbol: string;
  name: string;
  price?: number;
  exchange?: string;
}

let cachedStockList: FMPStockItem[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchStockList(): Promise<FMPStockItem[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedStockList && (now - lastCacheTime) < CACHE_DURATION) {
    console.log('📦 Using cached stock list');
    return cachedStockList;
  }

  try {
    console.log('🔍 Fetching fresh stock list from Financial Modeling Prep...');

    // Free tier endpoint - no API key required for stock list
    const url = 'https://financialmodelingprep.com/api/v3/stock/list';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Investie-StockSearch/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data: FMPStockItem[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from FMP API');
    }

    console.log(`✅ Fetched ${data.length} stocks from FMP`);

    // Cache the results
    cachedStockList = data;
    lastCacheTime = now;

    return data;
  } catch (error) {
    console.error('❌ Error fetching stock list:', error.message);

    // Return fallback to current hardcoded list if API fails
    const fallbackStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'AVGO', name: 'Broadcom Inc.' },
      { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'BAC', name: 'Bank of America Corporation' },
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'PFE', name: 'Pfizer Inc.' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' }
    ];

    console.log('🔄 Using fallback stock list');
    return fallbackStocks;
  }
}

function searchStocks(stockList: FMPStockItem[], query: string, limit = 20): StockSearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: StockSearchResult[] = [];

  for (const stock of stockList) {
    const symbolMatch = stock.symbol.toLowerCase().includes(lowerQuery);
    const nameMatch = stock.name.toLowerCase().includes(lowerQuery);

    if (symbolMatch || nameMatch) {
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        price: stock.price
      });

      if (results.length >= limit) break;
    }
  }

  // Sort results: exact symbol matches first, then partial matches
  results.sort((a, b) => {
    const aSymbolExact = a.symbol.toLowerCase() === lowerQuery;
    const bSymbolExact = b.symbol.toLowerCase() === lowerQuery;

    if (aSymbolExact && !bSymbolExact) return -1;
    if (!aSymbolExact && bSymbolExact) return 1;

    const aSymbolStarts = a.symbol.toLowerCase().startsWith(lowerQuery);
    const bSymbolStarts = b.symbol.toLowerCase().startsWith(lowerQuery);

    if (aSymbolStarts && !bSymbolStarts) return -1;
    if (!aSymbolStarts && bSymbolStarts) return 1;

    return a.symbol.localeCompare(b.symbol);
  });

  return results;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const { query, limit = 20 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({
        error: 'Query parameter is required',
        results: [],
        query: '',
        total: 0,
        source: 'error'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Fetch the stock list (cached or fresh)
    const stockList = await fetchStockList();

    // Perform the search
    const results = searchStocks(stockList, query, limit);

    const response: StockSearchResponse = {
      results,
      query,
      total: results.length,
      source: cachedStockList ? 'fmp_cached' : 'fmp_live'
    };

    console.log(`🔍 Search "${query}" returned ${results.length} results`);

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Stock search function error:', error.message);

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      results: [],
      query: '',
      total: 0,
      source: 'error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});