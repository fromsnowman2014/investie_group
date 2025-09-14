// Multi-Provider API System for Stock Market Data
// Supports multiple providers with automatic fallback and rotation

export interface StockQuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  source: string;
}

export interface ApiProvider {
  name: string;
  priority: number;
  isAvailable: boolean;
  rateLimit?: {
    remaining: number;
    resetTime?: string;
  };
  fetchQuote: (symbol: string) => Promise<StockQuoteData | null>;
}

// Alpha Vantage Provider
export class AlphaVantageProvider implements ApiProvider {
  name = 'alpha_vantage';
  priority = 1;
  isAvailable = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchQuote(symbol: string): Promise<StockQuoteData | null> {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      // Enhanced rate limit detection
      if (data.Information || data.Note) {
        const message = data.Information || data.Note;
        const rateLimitPatterns = ['rate limit', 'API call frequency', 'calls per day', 'Thank you for using Alpha Vantage'];
        
        if (rateLimitPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()))) {
          console.warn(`⚠️ ${this.name}: Rate limit detected - ${message}`);
          this.isAvailable = false;
          this.rateLimit = { remaining: 0, resetTime: 'Tomorrow (UTC)' };
          return null;
        }
      }
      
      const quote = data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) return null;
      
      return {
        symbol,
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
        volume: parseInt(quote['06. volume']) || undefined,
        source: this.name
      };
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return null;
    }
  }
}

// Yahoo Finance Provider (Using unofficial API)
export class YahooFinanceProvider implements ApiProvider {
  name = 'yahoo_finance';
  priority = 2;
  isAvailable = true;

  async fetchQuote(symbol: string): Promise<StockQuoteData | null> {
    try {
      // For S&P 500 index requests, use ^GSPC directly instead of SPY
      let actualSymbol = symbol;
      if (symbol === 'SPY') {
        actualSymbol = '^GSPC'; // S&P 500 Index
        console.log(`🔄 Converting SPY request to ^GSPC for direct S&P 500 index data`);
      } else if (symbol === 'QQQ') {
        actualSymbol = '^IXIC'; // NASDAQ Composite
        console.log(`🔄 Converting QQQ request to ^IXIC for direct NASDAQ index data`);
      } else if (symbol === 'DIA') {
        actualSymbol = '^DJI'; // Dow Jones Industrial Average
        console.log(`🔄 Converting DIA request to ^DJI for direct Dow index data`);
      }

      // Yahoo Finance v8 API endpoint (unofficial but working)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${actualSymbol}`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StockDataBot/1.0)'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      
      if (!result) return null;
      
      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
      const previousClose = meta.previousClose || 0;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      
      console.log(`✅ ${this.name}: Got direct index data for ${actualSymbol} = ${currentPrice}`);
      
      return {
        symbol: actualSymbol, // Return the actual symbol we fetched
        price: currentPrice,
        change,
        changePercent,
        volume: meta.regularMarketVolume || undefined,
        marketCap: meta.marketCap || undefined,
        source: this.name
      };
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return null;
    }
  }
}

// Twelve Data Provider
export class TwelveDataProvider implements ApiProvider {
  name = 'twelve_data';
  priority = 3;
  isAvailable = true;
  private apiKey: string;

  constructor(apiKey: string = 'demo') {
    this.apiKey = apiKey;
  }

  async fetchQuote(symbol: string): Promise<StockQuoteData | null> {
    try {
      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.status === 'error' || data.code) {
        if (data.message?.includes('limit') || data.message?.includes('exceeded')) {
          this.isAvailable = false;
          this.rateLimit = { remaining: 0 };
        }
        return null;
      }
      
      return {
        symbol,
        price: parseFloat(data.close) || 0,
        change: parseFloat(data.change) || 0,
        changePercent: parseFloat(data.percent_change) || 0,
        volume: parseInt(data.volume) || undefined,
        source: this.name
      };
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return null;
    }
  }
}

// Multi-Provider Manager
export class MultiProviderManager {
  private providers: ApiProvider[] = [];

  addProvider(provider: ApiProvider) {
    this.providers.push(provider);
    // Sort by priority (lower number = higher priority)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  async fetchQuote(symbol: string): Promise<{
    data: StockQuoteData | null;
    provider: string;
    isRateLimited: boolean;
    rateLimitMessage?: string;
  }> {
    console.log(`🔍 Fetching quote for ${symbol} using multi-provider system...`);
    
    for (const provider of this.providers) {
      if (!provider.isAvailable) {
        console.log(`⏭️ Skipping ${provider.name} (unavailable)`);
        continue;
      }
      
      console.log(`🎯 Trying ${provider.name}...`);
      const data = await provider.fetchQuote(symbol);
      
      if (data) {
        console.log(`✅ Success with ${provider.name}: ${data.price}`);
        return {
          data,
          provider: provider.name,
          isRateLimited: false
        };
      } else if (!provider.isAvailable) {
        console.log(`❌ ${provider.name} hit rate limit`);
        // Continue to next provider
      }
    }
    
    console.log(`❌ All providers failed for ${symbol}`);
    return {
      data: null,
      provider: 'none',
      isRateLimited: this.providers.every(p => !p.isAvailable),
      rateLimitMessage: this.providers.every(p => !p.isAvailable) 
        ? 'All API providers have reached their rate limits' 
        : undefined
    };
  }

  getProviderStatus() {
    return this.providers.map(p => ({
      name: p.name,
      priority: p.priority,
      available: p.isAvailable,
      rateLimit: p.rateLimit
    }));
  }

  resetProviderAvailability() {
    // Reset availability for next day (call this on schedule)
    this.providers.forEach(provider => {
      provider.isAvailable = true;
      provider.rateLimit = undefined;
    });
  }
}