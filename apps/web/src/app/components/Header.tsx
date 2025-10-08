'use client';

import { useState, useEffect } from 'react';
import { useStock } from './StockProvider';
import { StockSymbol } from '@/types/api';
import { POPULAR_STOCK_LIST } from '@/lib/stock-data';
import { useRefresh } from '@/app/contexts/RefreshContext';
import { validateStockSymbol } from '@/lib/stock-validation';
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  removeFromHistory,
  type SearchHistoryItem
} from '@/lib/search-history';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const { currentSymbol, setCurrentSymbol } = useStock();
  const { triggerRefresh, isRefreshing } = useRefresh();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Enhanced search with API validation
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
        // Not found: Show error (keep current stock visible)
        setSearchError(result.error || 'Stock ticker not found');
      }
    } catch (error) {
      console.error('Search error:', error);
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
  }, [searchQuery, searchError]);

  const handleStockSelect = (symbol: StockSymbol) => {
    setCurrentSymbol(symbol);
    setIsDropdownOpen(false);
    // Add to history when selected from dropdown
    const stock = POPULAR_STOCK_LIST.find(s => s.symbol === symbol);
    if (stock) {
      addToSearchHistory(symbol, stock.name);
      setSearchHistory(getSearchHistory());
    }
  };

  const handleHistorySelect = (symbol: string) => {
    setCurrentSymbol(symbol);
    setIsDropdownOpen(false);
    // Move to top of history
    const historyItem = searchHistory.find(item => item.symbol === symbol);
    if (historyItem) {
      addToSearchHistory(symbol, historyItem.name);
      setSearchHistory(getSearchHistory());
    }
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setSearchHistory([]);
  };

  const handleRemoveHistoryItem = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(symbol);
    setSearchHistory(getSearchHistory());
  };

  const filteredStocks = POPULAR_STOCK_LIST.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="modern-header">
      {/* Logo */}
      <div className="header-logo">
        <span className="logo-icon">📊</span>
        <span className="logo-text">Investie</span>
        <span className="logo-subtitle">AI Investment Analysis</span>
      </div>

      {/* Navigation & Controls */}
      <div className="header-controls">
        {/* Global Refresh Button */}
        <button
          onClick={triggerRefresh}
          disabled={isRefreshing}
          className="global-refresh-button"
          title="Refresh all data"
          aria-label="Refresh all data"
        >
          <svg
            className={`refresh-icon ${isRefreshing ? 'refreshing' : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>

        {/* Current Stock Display */}
        <div className="current-stock-display">
          <span className="stock-label">Analyzing:</span>
          <span className="stock-symbol">{currentSymbol}</span>
        </div>

        {/* Stock Selector Dropdown with History */}
        <div className="stock-selector">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="selector-button"
          >
            <span>Change Stock</span>
            <svg className="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="selector-dropdown">
              {/* Recently Viewed Section */}
              {searchHistory.length > 0 && (
                <>
                  <div className="dropdown-header">
                    <span>Recently Viewed</span>
                    <button
                      onClick={handleClearHistory}
                      className="clear-history-button"
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="dropdown-items">
                    {searchHistory.slice(0, 5).map(item => (
                      <button
                        key={item.symbol}
                        onClick={() => handleHistorySelect(item.symbol)}
                        className={`dropdown-item ${currentSymbol === item.symbol ? 'selected' : ''}`}
                        type="button"
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
                            onClick={(e) => handleRemoveHistoryItem(item.symbol, e)}
                            className="remove-history-item"
                            title="Remove from history"
                            type="button"
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

              {/* Popular Stocks Section */}
              <div className="dropdown-header">
                <span>Popular Stocks</span>
              </div>
              <div className="dropdown-items">
                {POPULAR_STOCK_LIST.slice(0, 10).map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`dropdown-item ${currentSymbol === stock.symbol ? 'selected' : ''}`}
                    type="button"
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

        {/* Enhanced Search with Error Handling */}
        <form onSubmit={handleSearch} className="stock-search">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search any US stock (e.g., AAPL, Tesla)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`search-input-field ${searchError ? 'error' : ''}`}
                disabled={isSearching}
                aria-label="Search stock by ticker or company name"
                aria-describedby={searchError ? "search-error" : undefined}
                aria-invalid={!!searchError}
              />
              {isSearching && (
                <div className="search-loading-spinner" />
              )}
            </div>

            {/* Error message */}
            {searchError && (
              <div id="search-error" className="search-error-message" role="alert" aria-live="polite">
                <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{searchError}</span>
                <button
                  type="button"
                  onClick={() => setSearchError(null)}
                  className="error-dismiss"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Search results dropdown (for popular stocks only) */}
            {searchQuery && filteredStocks.length > 0 && !searchError && !isSearching && (
              <div className="search-results">
                <div className="results-header">
                  <span>Search Results</span>
                </div>
                {filteredStocks.slice(0, 5).map(stock => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => {
                      setCurrentSymbol(stock.symbol);
                      addToSearchHistory(stock.symbol, stock.name);
                      setSearchHistory(getSearchHistory());
                      setSearchQuery('');
                    }}
                    className="result-item"
                  >
                    <div className="result-symbol">{stock.symbol}</div>
                    {stock.name && stock.name !== stock.symbol && (
                      <div className="result-name">{stock.name}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </header>
  );
}
