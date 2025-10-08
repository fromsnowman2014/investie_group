# Universal Stock Search Implementation Plan

## Executive Summary
Implement a comprehensive stock search system that allows users to search and analyze any US-listed stock (not just the current 17 predefined stocks), with cookie-based search history management and elegant error handling.

---

## Current System Analysis

### 1. Current Search Flow
**File**: [apps/web/src/app/components/Header.tsx](apps/web/src/app/components/Header.tsx)

```typescript
// Line 32-44: Current search implementation
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const matchingStock = stockData.find(stock =>
    stock.symbol.toLowerCase() === searchQuery.toLowerCase() ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (matchingStock) {
    setCurrentSymbol(matchingStock.symbol);
    setSearchQuery('');
  }
  // ❌ PROBLEM: No feedback when stock is not found
  // ❌ PROBLEM: Only searches within predefined stockData array
};
```

**Key Issues**:
- ❌ Searches only within `STOCK_LIST` (17 stocks) from [stock-data.ts](apps/web/src/lib/stock-data.ts:7-25)
- ❌ No error message when stock symbol/name is not found
- ❌ No API call to validate if ticker exists in real market data
- ❌ Silent failure - user doesn't know why search didn't work

### 2. Stock Selector Dropdown
**File**: [apps/web/src/app/components/Header.tsx](apps/web/src/app/components/Header.tsx:96-129)

```typescript
// Line 114-125: Dropdown items
{STOCK_SYMBOLS.map(symbol => (
  <button key={symbol} onClick={() => handleStockSelect(symbol)}>
    <span className="item-symbol">{symbol}</span>
  </button>
))}
```

**Key Issues**:
- ❌ Shows only hardcoded `STOCK_SYMBOLS` array (10 stocks)
- ❌ No search history integration
- ❌ No recently viewed stocks

### 3. Type System Constraints
**File**: [apps/web/src/types/api.ts](apps/web/src/types/api.ts:2-5)

```typescript
export type StockSymbol =
  | 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN'
  | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD'
  | 'JPM' | 'BAC' | 'JNJ' | 'PFE' | 'SPY' | 'QQQ' | 'VTI';
```

**Key Issues**:
- ❌ Hardcoded union type prevents searching arbitrary symbols
- ❌ TypeScript will reject any symbol not in this list
- ❌ Need to change to `string` type or make it more flexible

---

## Implementation Plan

### Phase 1: Type System Modernization

#### 1.1 Update StockSymbol Type
**File**: [apps/web/src/types/api.ts](apps/web/src/types/api.ts)

**Changes**:
```typescript
// BEFORE (Line 2-5):
export type StockSymbol = 'AAPL' | 'TSLA' | ...;

// AFTER:
export type StockSymbol = string; // Accept any valid stock ticker

// Keep predefined list for UI convenience
export const POPULAR_STOCKS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN',
  'NVDA', 'META', 'NFLX', 'AVGO', 'AMD',
  'JPM', 'BAC', 'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
] as const;
```

**Rationale**:
- Allows searching any US-listed stock
- Maintains type safety with `string` type
- Keeps popular stocks list for default UI

#### 1.2 Update Stock Data Module
**File**: [apps/web/src/lib/stock-data.ts](apps/web/src/lib/stock-data.ts)

**Changes**:
```typescript
// Keep STOCK_LIST for default/popular stocks
export const POPULAR_STOCK_LIST = [...existing list...];

// NEW: Validation function (doesn't restrict to list)
export function isValidStockFormat(symbol: string): boolean {
  // US stock tickers: 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}

// NEW: Normalize ticker input
export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}
```

---

### Phase 2: Stock Symbol Validation API

#### 2.1 Create Stock Validation Utility
**New File**: `apps/web/src/lib/stock-validation.ts`

**Purpose**: Validate if a stock symbol exists using real market data APIs

**Implementation**:
```typescript
export interface StockValidationResult {
  isValid: boolean;
  symbol: string;
  name?: string;
  error?: string;
  source: 'cache' | 'api' | 'fallback';
}

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

  // 3. API validation using existing stock-data endpoint
  try {
    const response = await edgeFunctionFetcher('stock-data', {
      method: 'POST',
      body: JSON.stringify({ symbol: normalized })
    });

    if (response.success && response.data) {
      return {
        isValid: true,
        symbol: normalized,
        name: response.data.name || normalized,
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
    return {
      isValid: false,
      symbol: normalized,
      error: 'Unable to validate ticker',
      source: 'fallback'
    };
  }
}
```

**Dependencies**: Uses existing `edgeFunctionFetcher` from [api-utils.ts](apps/web/src/lib/api-utils.ts)

---

### Phase 3: Cookie-Based Search History

#### 3.1 Create Search History Manager
**New File**: `apps/web/src/lib/search-history.ts`

**Purpose**: Manage recently searched stocks in browser cookies

**Implementation**:
```typescript
const HISTORY_COOKIE_NAME = 'investie_search_history';
const MAX_HISTORY_ITEMS = 10;
const COOKIE_EXPIRY_DAYS = 90;

export interface SearchHistoryItem {
  symbol: string;
  name?: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${HISTORY_COOKIE_NAME}=`));

  if (!cookie) return [];

  try {
    const value = decodeURIComponent(cookie.split('=')[1]);
    const history = JSON.parse(value) as SearchHistoryItem[];

    // Sort by timestamp (most recent first)
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function addToSearchHistory(
  symbol: string,
  name?: string
): void {
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

export function clearSearchHistory(): void {
  document.cookie = `${HISTORY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function removeFromHistory(symbol: string): void {
  const current = getSearchHistory();
  const filtered = current.filter(item => item.symbol !== symbol);

  const value = encodeURIComponent(JSON.stringify(filtered));
  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);

  document.cookie = `${HISTORY_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
```

**Cookie Structure**:
```json
[
  {"symbol": "TSLA", "name": "Tesla, Inc.", "timestamp": 1696723200000},
  {"symbol": "COIN", "name": "Coinbase Global, Inc.", "timestamp": 1696636800000},
  {"symbol": "PLTR", "timestamp": 1696550400000}
]
```

**Privacy & Security**:
- ✅ Client-side only (no server tracking)
- ✅ 90-day expiry (auto-cleanup)
- ✅ SameSite=Lax (CSRF protection)
- ✅ No sensitive data (just stock symbols)
- ✅ Limited to 10 items (prevents cookie bloat)

---

### Phase 4: Enhanced Search Component

#### 4.1 Update Header Search Functionality
**File**: [apps/web/src/app/components/Header.tsx](apps/web/src/app/components/Header.tsx)

**Changes**:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useStock } from './StockProvider';
import { StockSymbol } from '@/types/api';
import { POPULAR_STOCK_LIST } from '@/lib/stock-data';
import { useRefresh } from '@/app/contexts/RefreshContext';
import { validateStockSymbol } from '@/lib/stock-validation'; // NEW
import {
  getSearchHistory,
  addToSearchHistory
} from '@/lib/search-history'; // NEW

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // NEW
  const [searchError, setSearchError] = useState<string | null>(null); // NEW
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]); // NEW
  const { currentSymbol, setCurrentSymbol } = useStock();
  const { triggerRefresh, isRefreshing } = useRefresh();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // NEW: Enhanced search with validation
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await validateStockSymbol(searchQuery);

      if (result.isValid) {
        // Success: Update symbol and add to history
        setCurrentSymbol(result.symbol);
        addToSearchHistory(result.symbol, result.name);
        setSearchHistory(getSearchHistory()); // Refresh UI
        setSearchQuery('');
        setSearchError(null);
      } else {
        // Not found: Show error
        setSearchError(result.error || 'Stock ticker not found');
      }
    } catch (error) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Clear error when user types
  useEffect(() => {
    if (searchQuery && searchError) {
      setSearchError(null);
    }
  }, [searchQuery]);

  // ... rest of component
}
```

#### 4.2 Add Search Error UI
**Location**: Same file, within the search form

```typescript
{/* Enhanced Search with Error State */}
<form onSubmit={handleSearch} className="stock-search">
  <div className="search-container">
    <div className="search-input-wrapper">
      <svg className="search-icon" {...} />
      <input
        type="search"
        placeholder="Search any US stock (e.g., AAPL, Tesla)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`search-input-field ${searchError ? 'error' : ''}`}
        disabled={isSearching}
      />
      {isSearching && (
        <div className="search-loading-spinner" />
      )}
    </div>

    {/* NEW: Error message */}
    {searchError && (
      <div className="search-error-message">
        <svg className="error-icon" {...}>
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{searchError}</span>
        <button
          type="button"
          onClick={() => setSearchError(null)}
          className="error-dismiss"
        >
          ×
        </button>
      </div>
    )}

    {/* Existing search results dropdown */}
    {searchQuery && filteredStocks.length > 0 && !searchError && (
      <div className="search-results">
        {/* ... existing code ... */}
      </div>
    )}
  </div>
</form>
```

---

### Phase 5: Enhanced Stock Selector with History

#### 5.1 Update Selector Dropdown
**File**: [apps/web/src/app/components/Header.tsx](apps/web/src/app/components/Header.tsx:96-129)

**Changes**:

```typescript
{/* Stock Selector Dropdown with History */}
<div className="stock-selector">
  <button
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="selector-button"
  >
    <span>Change Stock</span>
    <svg className="dropdown-arrow" {...} />
  </button>

  {isDropdownOpen && (
    <div className="selector-dropdown">
      {/* NEW: Recently Viewed Section */}
      {searchHistory.length > 0 && (
        <>
          <div className="dropdown-header">
            <span>Recently Viewed</span>
            <button
              onClick={() => {
                clearSearchHistory();
                setSearchHistory([]);
              }}
              className="clear-history-button"
            >
              Clear
            </button>
          </div>
          <div className="dropdown-items">
            {searchHistory.slice(0, 5).map(item => (
              <button
                key={item.symbol}
                onClick={() => handleStockSelect(item.symbol)}
                className={`dropdown-item ${currentSymbol === item.symbol ? 'selected' : ''}`}
              >
                <div className="item-content">
                  <span className="item-symbol">{item.symbol}</span>
                  {item.name && (
                    <span className="item-name">{item.name}</span>
                  )}
                </div>
                <div className="item-actions">
                  {currentSymbol === item.symbol && (
                    <span className="item-indicator">✓</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.symbol);
                      setSearchHistory(getSearchHistory());
                    }}
                    className="remove-history-item"
                    title="Remove from history"
                  >
                    ×
                  </button>
                </div>
              </button>
            ))}
          </div>
          <div className="dropdown-divider" />
        </>
      )}

      {/* Existing: Popular Stocks Section */}
      <div className="dropdown-header">
        <span>Popular Stocks</span>
      </div>
      <div className="dropdown-items">
        {POPULAR_STOCK_LIST.slice(0, 10).map(stock => (
          <button
            key={stock.symbol}
            onClick={() => handleStockSelect(stock.symbol)}
            className={`dropdown-item ${currentSymbol === stock.symbol ? 'selected' : ''}`}
          >
            <div className="item-content">
              <span className="item-symbol">{stock.symbol}</span>
              <span className="item-name">{stock.name}</span>
            </div>
            {currentSymbol === stock.symbol && (
              <span className="item-indicator">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
```

---

### Phase 6: CSS Styling Updates

#### 6.1 Add New Styles
**File**: [apps/web/src/app/globals.css](apps/web/src/app/globals.css)

**Insert after Line 538** (after existing `.result-name` style):

```css
/* Search Error State */
.search-input-field.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.search-input-field.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  border-color: #dc2626;
}

.search-error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-xs);
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: #991b1b;
  font-size: 0.875rem;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  flex-shrink: 0;
}

.error-dismiss {
  margin-left: auto;
  padding: 0 var(--spacing-xs);
  background: transparent;
  border: none;
  color: #991b1b;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.error-dismiss:hover {
  opacity: 1;
}

.search-loading-spinner {
  position: absolute;
  right: var(--spacing-sm);
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dropdown Enhancements */
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.clear-history-button {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-history-button:hover {
  background: var(--color-surface);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--spacing-xs) 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: var(--color-surface);
}

.dropdown-item.selected {
  background: rgba(37, 99, 235, 0.05);
}

.item-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.item-symbol {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.item-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.item-indicator {
  color: var(--color-primary);
  font-weight: 700;
}

.remove-history-item {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.dropdown-item:hover .remove-history-item {
  opacity: 1;
}

.remove-history-item:hover {
  color: #ef4444;
  background: #fef2f2;
  border-radius: 4px;
}
```

---

### Phase 7: User Experience Enhancements

#### 7.1 Current State Preservation
**Implementation**: When stock is not found, maintain current view

```typescript
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();

  // ... validation code ...

  if (result.isValid) {
    setCurrentSymbol(result.symbol); // Switch to new stock
  } else {
    // DO NOT change currentSymbol - keep current stock visible
    setSearchError(result.error); // Show error overlay
  }
};
```

**User Flow**:
1. User is viewing AAPL
2. User searches for "INVALID"
3. Error message appears: "Stock ticker not found"
4. AAPL data remains visible (no disruption)
5. User can dismiss error and continue

#### 7.2 Smart Search Suggestions
**Enhancement**: Show similar tickers when exact match fails

```typescript
// In stock-validation.ts
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
```

**UI Integration**:
```typescript
{searchError && (
  <div className="search-error-message">
    <span>{searchError}</span>
    {suggestions.length > 0 && (
      <div className="error-suggestions">
        Did you mean: {suggestions.map(s => (
          <button key={s} onClick={() => setSearchQuery(s)}>
            {s}
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

---

## Testing Strategy

### Unit Tests
**New File**: `apps/web/src/lib/__tests__/search-history.test.ts`

```typescript
describe('Search History', () => {
  beforeEach(() => {
    clearSearchHistory();
  });

  it('should add stock to history', () => {
    addToSearchHistory('TSLA', 'Tesla, Inc.');
    const history = getSearchHistory();
    expect(history).toHaveLength(1);
    expect(history[0].symbol).toBe('TSLA');
  });

  it('should limit history to 10 items', () => {
    for (let i = 0; i < 15; i++) {
      addToSearchHistory(`STOCK${i}`);
    }
    const history = getSearchHistory();
    expect(history).toHaveLength(10);
  });

  it('should move existing stock to top when re-searched', () => {
    addToSearchHistory('AAPL');
    addToSearchHistory('TSLA');
    addToSearchHistory('AAPL'); // Re-search

    const history = getSearchHistory();
    expect(history[0].symbol).toBe('AAPL');
    expect(history).toHaveLength(2); // No duplicates
  });
});
```

### Integration Tests
**Test File**: `apps/web/src/app/components/__tests__/Header.test.tsx`

```typescript
describe('Header Search', () => {
  it('should show error for invalid ticker', async () => {
    render(<Header />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'INVALID123' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it('should add to history on successful search', async () => {
    render(<Header />);

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'AAPL' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      const history = getSearchHistory();
      expect(history[0].symbol).toBe('AAPL');
    });
  });
});
```

### Manual Testing Checklist

#### Search Functionality
- [ ] Search by exact ticker (e.g., "AAPL")
- [ ] Search by company name (e.g., "Apple")
- [ ] Search with lowercase (e.g., "tsla")
- [ ] Search with extra spaces (e.g., " MSFT ")
- [ ] Search invalid ticker (e.g., "INVALID")
- [ ] Search with special characters (e.g., "AAPL!")
- [ ] Search empty string
- [ ] Search while previous search is loading

#### History Functionality
- [ ] History appears in dropdown after search
- [ ] History shows max 5 items in dropdown
- [ ] History sorted by most recent first
- [ ] Clicking history item switches stock
- [ ] Remove individual history item works
- [ ] Clear all history works
- [ ] History persists after page reload
- [ ] History works across browser tabs
- [ ] History expires after 90 days

#### Error Handling
- [ ] Error message appears for invalid ticker
- [ ] Error message dismissible via X button
- [ ] Error clears when typing new search
- [ ] Current stock view preserved during error
- [ ] Network error handled gracefully
- [ ] API timeout handled gracefully

#### UI/UX
- [ ] Loading spinner appears during search
- [ ] Search input disabled during search
- [ ] Error message has smooth animation
- [ ] Dropdown closes after selection
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader accessibility

---

## Migration & Rollout Plan

### Step 1: Feature Flag (Optional)
**File**: `apps/web/src/lib/feature-flags.ts` (new)

```typescript
export const FEATURE_FLAGS = {
  UNIVERSAL_STOCK_SEARCH: process.env.NEXT_PUBLIC_ENABLE_UNIVERSAL_SEARCH === 'true'
};
```

**Usage**:
```typescript
const handleSearch = FEATURE_FLAGS.UNIVERSAL_STOCK_SEARCH
  ? handleUniversalSearch
  : handleLegacySearch;
```

### Step 2: Gradual Rollout
1. **Week 1**: Deploy with feature flag disabled (code review)
2. **Week 2**: Enable for internal testing (5% traffic)
3. **Week 3**: Enable for beta users (20% traffic)
4. **Week 4**: Full rollout (100% traffic)

### Step 3: Monitoring
**Metrics to Track**:
- Search success rate (found vs. not found)
- Most searched non-popular stocks
- History usage rate
- Error rate by error type
- Average search latency

**Analytics Events**:
```typescript
// Track successful searches
trackEvent('stock_search_success', { symbol, source: 'api' });

// Track failed searches
trackEvent('stock_search_failed', { query, error });

// Track history usage
trackEvent('stock_history_clicked', { symbol, position: index });
```

---

## Security & Performance Considerations

### Security
1. **Cookie Security**:
   - ✅ SameSite=Lax (CSRF protection)
   - ✅ No sensitive data (public stock symbols only)
   - ✅ Size limit (max 10 items = ~500 bytes)
   - ✅ No XSS risk (symbols validated/sanitized)

2. **Input Validation**:
   - ✅ Regex validation (`/^[A-Z]{1,5}$/`)
   - ✅ Length limits (1-5 characters)
   - ✅ Uppercase normalization
   - ✅ Trim whitespace

3. **API Security**:
   - ✅ Rate limiting (inherited from Supabase Edge Functions)
   - ✅ No SQL injection risk (API endpoints are serverless)
   - ✅ CORS properly configured

### Performance
1. **Caching**:
   - Popular stocks cached in-memory (instant lookup)
   - API validation only for unknown symbols
   - Search history cached in cookie (no database)

2. **Optimization**:
   - Debounce search input (300ms delay)
   - Cancel pending requests on new search
   - Lazy load dropdown (render only when open)

3. **Bundle Size**:
   - New code: ~3KB (minified + gzipped)
   - No new dependencies
   - Uses existing `edgeFunctionFetcher`

---

## Accessibility (a11y) Requirements

### ARIA Labels
```typescript
<input
  type="search"
  aria-label="Search stock by ticker or company name"
  aria-describedby={searchError ? "search-error" : undefined}
  aria-invalid={!!searchError}
/>

{searchError && (
  <div id="search-error" role="alert" aria-live="polite">
    {searchError}
  </div>
)}
```

### Keyboard Navigation
- **Enter**: Submit search
- **Escape**: Close dropdown / dismiss error
- **Tab**: Navigate between elements
- **Arrow keys**: Navigate dropdown items

### Screen Reader Support
```typescript
<button aria-label={`Remove ${symbol} from search history`}>
  ×
</button>

<div role="status" aria-live="polite">
  {isSearching && "Searching..."}
</div>
```

---

## Documentation Updates

### 1. Update CLAUDE.md
**Section**: API Integration Pattern

**Add**:
```markdown
### Stock Search System
- **Universal Search**: Search any US-listed stock (not limited to predefined list)
- **Validation**: Real-time ticker validation via `stock-data` Edge Function
- **History**: Cookie-based search history (max 10 items, 90-day expiry)
- **Error Handling**: User-friendly error messages with current view preservation
```

### 2. Create User Guide
**New File**: `docs/user-guide-stock-search.md`

**Content**:
```markdown
# Stock Search User Guide

## How to Search for Stocks

1. **By Ticker Symbol**: Type exact symbol (e.g., AAPL, TSLA)
2. **By Company Name**: Type company name (e.g., Apple, Tesla)
3. **Case Insensitive**: Works with any case (aapl = AAPL)

## Recently Viewed Stocks

Your last 10 searched stocks are saved for 90 days. Access them via:
- Click "Change Stock" button
- See "Recently Viewed" section at top

## Troubleshooting

**"Stock ticker not found"**
- Check spelling of ticker symbol
- Ensure it's a US-listed stock
- Try full company name instead

**Search not working**
- Check internet connection
- Wait a moment and retry
- Clear browser cache if persistent
```

---

## File Structure Summary

### New Files
```
apps/web/src/
├── lib/
│   ├── stock-validation.ts          (Stock symbol validator)
│   ├── search-history.ts             (Cookie-based history manager)
│   └── __tests__/
│       ├── stock-validation.test.ts
│       └── search-history.test.ts
│
docs/
├── universal-stock-search-implementation-plan.md  (This file)
└── user-guide-stock-search.md        (End-user documentation)
```

### Modified Files
```
apps/web/src/
├── types/api.ts                      (Change StockSymbol type)
├── lib/stock-data.ts                 (Add validation helpers)
├── app/components/Header.tsx         (Enhanced search + history)
├── app/globals.css                   (New styles)
└── app/components/__tests__/Header.test.tsx  (New tests)

docs/
└── CLAUDE.md                         (Update with new features)
```

---

## Implementation Checklist

### Phase 1: Foundation (Day 1)
- [ ] Update `StockSymbol` type in [api.ts](apps/web/src/types/api.ts)
- [ ] Add validation helpers to [stock-data.ts](apps/web/src/lib/stock-data.ts)
- [ ] Create `stock-validation.ts` utility
- [ ] Create `search-history.ts` utility
- [ ] Write unit tests for both utilities

### Phase 2: Search Enhancement (Day 2)
- [ ] Update Header search handler with async validation
- [ ] Add error state UI to search form
- [ ] Add loading spinner
- [ ] Test search with various inputs
- [ ] Add error message animations

### Phase 3: History Integration (Day 3)
- [ ] Integrate search history in `Header.tsx`
- [ ] Update selector dropdown with history section
- [ ] Add "Clear" and "Remove" functionality
- [ ] Test history persistence across sessions
- [ ] Test history UI interactions

### Phase 4: Styling & UX (Day 4)
- [ ] Add all new CSS to [globals.css](apps/web/src/app/globals.css)
- [ ] Test mobile responsive layout
- [ ] Add smooth animations
- [ ] Test dark mode compatibility (if applicable)
- [ ] Accessibility review (ARIA, keyboard nav)

### Phase 5: Testing & Documentation (Day 5)
- [ ] Write integration tests
- [ ] Manual testing checklist completion
- [ ] Update CLAUDE.md
- [ ] Create user guide
- [ ] Code review and refinements

---

## Risk Assessment

### Low Risk ✅
- Cookie-based storage (no backend changes)
- Additive changes (no breaking changes)
- Uses existing API endpoints
- Feature flag ready

### Medium Risk ⚠️
- Type system change (`StockSymbol` from union to string)
  - **Mitigation**: Keep `POPULAR_STOCKS` constant for type safety where needed
- API validation latency
  - **Mitigation**: Cache popular stocks, show loading state

### High Risk ❌
- None identified

---

## Future Enhancements (Out of Scope)

### Phase 8+: Advanced Features
1. **Autocomplete API**: Real-time suggestions from stock ticker API
2. **Search Analytics**: Track popular searches for UX insights
3. **Custom Lists**: Allow users to create custom watchlists
4. **Multi-Symbol Compare**: Compare multiple stocks side-by-side
5. **International Markets**: Expand beyond US stocks (requires backend changes)
6. **Voice Search**: "Hey Investie, show me Tesla stock"

---

## Questions for Product Review

Before implementation, confirm:

1. **API Rate Limits**: How many stock-data API calls per user per day?
2. **Supported Markets**: US-only or include NASDAQ, NYSE, OTC?
3. **Error UX**: Should we show "Did you mean?" suggestions?
4. **History Privacy**: Should history be clearable? (Planned: Yes)
5. **Analytics**: What search metrics should we track?

---

## Success Metrics

### KPIs to Measure
1. **Search Success Rate**: Target 85%+ (valid ticker found)
2. **History Usage**: Target 30%+ users click history items
3. **Search Latency**: Target <500ms average validation time
4. **Error Rate**: Target <10% user-facing errors
5. **Retention**: Users searching >3 different stocks per session

### Acceptance Criteria
- ✅ Search works for any valid US stock ticker
- ✅ Error message appears for invalid tickers
- ✅ Current stock view preserved during errors
- ✅ Search history persists across sessions
- ✅ History shows in "Change Stock" dropdown
- ✅ Mobile responsive
- ✅ No performance regression
- ✅ All tests passing

---

## Timeline Estimate

**Total**: 5-7 working days

- **Day 1**: Foundation (types, utilities, tests) - 6 hours
- **Day 2**: Search enhancement - 6 hours
- **Day 3**: History integration - 6 hours
- **Day 4**: Styling & UX - 4 hours
- **Day 5**: Testing & docs - 4 hours
- **Day 6-7**: Buffer for refinements - 4 hours

**Total Effort**: ~30 hours

---

## Appendix: Key Code References

### Current Implementation
- **Header Component**: [Header.tsx:32-44](apps/web/src/app/components/Header.tsx) (search handler)
- **Stock Selector**: [Header.tsx:96-129](apps/web/src/app/components/Header.tsx) (dropdown)
- **Stock List**: [stock-data.ts:7-25](apps/web/src/lib/stock-data.ts) (predefined stocks)
- **Type Definition**: [api.ts:2-5](apps/web/src/types/api.ts) (StockSymbol type)
- **Search Styles**: [globals.css:442-538](apps/web/src/app/globals.css) (stock-search class)

### API Integration
- **API Utils**: [api-utils.ts](apps/web/src/lib/api-utils.ts) (`edgeFunctionFetcher`)
- **Stock Data API**: Supabase Edge Function `/functions/v1/stock-data`
- **Request Format**: `POST { symbol: "AAPL" }`
- **Response Format**: `{ success: boolean, data: {...}, error?: string }`

---

**END OF IMPLEMENTATION PLAN**

---

## Next Steps

1. ✅ **Review this plan** with product/engineering team
2. ⏸️ **Get approval** on approach and scope
3. ⏸️ **Start implementation** following checklist above
4. ⏸️ **Deploy** with feature flag
5. ⏸️ **Monitor** metrics and user feedback
6. ⏸️ **Iterate** based on learnings
