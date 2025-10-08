import { POPULAR_STOCK_LIST, isValidStockFormat, normalizeSymbol } from '@/lib/stock-data';
import { fetchStockDataDirect } from '@/lib/direct-api-client';

/**
 * Result of stock symbol validation
 */
export interface StockValidationResult {
  isValid: boolean;
  symbol: string;
  name?: string;
  error?: string;
  source: 'cache' | 'api' | 'fallback';
}

/**
 * Validate if a stock symbol exists using real market data
 * @param symbol - Stock ticker to validate
 * @returns Validation result with symbol info or error
 */
export async function validateStockSymbol(
  symbol: string
): Promise<StockValidationResult> {
  const normalized = normalizeSymbol(symbol);

  // 1. Format validation
  if (!isValidStockFormat(normalized)) {
    return {
      isValid: false,
      symbol: normalized,
      error: 'Invalid ticker format (must be 1-5 letters)',
      source: 'fallback'
    };
  }

  // 2. Check popular stocks cache (instant response)
  const popular = POPULAR_STOCK_LIST.find(
    s => s.symbol === normalized
  );
  if (popular) {
    return {
      isValid: true,
      symbol: normalized,
      name: popular.name,
      source: 'cache'
    };
  }

  // 3. API validation using direct API client
  try {
    const response = await fetchStockDataDirect(normalized);

    if (response.success && response.data) {
      // Extract company name from metadata or data_value
      const name =
        (response.data.metadata?.name as string) ||
        (response.data.data_value?.name as string) ||
        normalized;

      return {
        isValid: true,
        symbol: normalized,
        name: name,
        source: 'api'
      };
    } else {
      return {
        isValid: false,
        symbol: normalized,
        error: 'Stock ticker not found',
        source: 'api'
      };
    }
  } catch (error) {
    console.error('Stock validation error:', error);
    return {
      isValid: false,
      symbol: normalized,
      error: 'Unable to validate ticker',
      source: 'fallback'
    };
  }
}

/**
 * Suggest similar tickers when exact match fails
 * @param input - User's search input
 * @returns Array of similar stock symbols
 */
export function suggestSimilarTickers(input: string): string[] {
  const normalized = normalizeSymbol(input);

  // Find similar popular stocks
  const suggestions = POPULAR_STOCK_LIST
    .filter(stock =>
      stock.symbol.includes(normalized) ||
      stock.name.toLowerCase().includes(input.toLowerCase())
    )
    .map(stock => stock.symbol)
    .slice(0, 3);

  return suggestions;
}
