import { StockSymbol } from '@/types/api';

/**
 * Available stock symbols with company names
 * Matches the VALID_SYMBOLS from Supabase stock-data function
 */
export const STOCK_LIST: Array<{ symbol: StockSymbol; name: string }> = [
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

/**
 * Get all available stocks
 * @returns Promise<Array<{ symbol: StockSymbol; name: string }>>
 */
export async function getAllStocks(): Promise<Array<{ symbol: StockSymbol; name: string }>> {
  // Return hardcoded stock list since we know all supported symbols
  return Promise.resolve(STOCK_LIST);
}

/**
 * Search stocks by symbol or name
 * @param query - Search query
 * @returns Array of matching stocks
 */
export function searchStocks(query: string): Array<{ symbol: StockSymbol; name: string }> {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return STOCK_LIST.filter(stock =>
    stock.symbol.toLowerCase().includes(lowerQuery) ||
    stock.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get stock by symbol
 * @param symbol - Stock symbol
 * @returns Stock data or null if not found
 */
export function getStockBySymbol(symbol: string): { symbol: StockSymbol; name: string } | null {
  return STOCK_LIST.find(stock => 
    stock.symbol.toLowerCase() === symbol.toLowerCase()
  ) || null;
}

/**
 * Check if symbol is valid/supported
 * @param symbol - Stock symbol to check
 * @returns boolean
 */
export function isValidSymbol(symbol: string): symbol is StockSymbol {
  return STOCK_LIST.some(stock => 
    stock.symbol.toLowerCase() === symbol.toLowerCase()
  );
}