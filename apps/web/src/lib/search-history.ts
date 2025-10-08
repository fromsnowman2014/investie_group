/**
 * Cookie-based search history manager
 * Stores recently searched stock symbols in browser cookies
 */

const HISTORY_COOKIE_NAME = 'investie_search_history';
const MAX_HISTORY_ITEMS = 10;
const COOKIE_EXPIRY_DAYS = 90;

/**
 * Search history item structure
 */
export interface SearchHistoryItem {
  symbol: string;
  name?: string;
  timestamp: number;
}

/**
 * Get search history from cookie
 * @returns Array of search history items, sorted by most recent
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${HISTORY_COOKIE_NAME}=`));

  if (!cookie) return [];

  try {
    const value = decodeURIComponent(cookie.split('=')[1]);
    const history = JSON.parse(value) as SearchHistoryItem[];

    // Sort by timestamp (most recent first)
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to parse search history:', error);
    return [];
  }
}

/**
 * Add a stock to search history
 * @param symbol - Stock ticker symbol
 * @param name - Company name (optional)
 */
export function addToSearchHistory(
  symbol: string,
  name?: string
): void {
  if (typeof window === 'undefined') return;

  const current = getSearchHistory();

  // Remove duplicate if exists
  const filtered = current.filter(
    item => item.symbol !== symbol
  );

  // Add new item at the beginning
  const updated: SearchHistoryItem[] = [
    { symbol, name, timestamp: Date.now() },
    ...filtered
  ].slice(0, MAX_HISTORY_ITEMS); // Keep only last 10

  // Save to cookie
  const value = encodeURIComponent(JSON.stringify(updated));
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);

  document.cookie = `${HISTORY_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;

  document.cookie = `${HISTORY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Remove a specific symbol from history
 * @param symbol - Stock ticker to remove
 */
export function removeFromHistory(symbol: string): void {
  if (typeof window === 'undefined') return;

  const current = getSearchHistory();
  const filtered = current.filter(item => item.symbol !== symbol);

  const value = encodeURIComponent(JSON.stringify(filtered));
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);

  document.cookie = `${HISTORY_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
