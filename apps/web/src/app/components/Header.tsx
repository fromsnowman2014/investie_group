'use client';

import { useState, useEffect } from 'react';
import { useStock } from './StockProvider';
import { StockSymbol } from '@/types/api';
import { getAllStocks } from '@/lib/stock-data';

const STOCK_SYMBOLS: StockSymbol[] = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 
  'NVDA', 'META', 'NFLX', 'AVGO', 'AMD'
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stockData, setStockData] = useState<Array<{ symbol: StockSymbol; name: string }>>([]);
  const { currentSymbol, setCurrentSymbol } = useStock();

  useEffect(() => {
    // Load stock data for the dropdown
    getAllStocks().then(data => {
      setStockData(data);
    }).catch(error => {
      console.error('Failed to load stock data:', error);
      // Fallback to symbol list
      setStockData(STOCK_SYMBOLS.map(symbol => ({ symbol, name: symbol })));
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Find matching stock
    const matchingStock = stockData.find(stock => 
      stock.symbol.toLowerCase() === searchQuery.toLowerCase() ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (matchingStock) {
      setCurrentSymbol(matchingStock.symbol);
      setSearchQuery('');
    }
  };

  const handleStockSelect = (symbol: StockSymbol) => {
    setCurrentSymbol(symbol);
    setIsDropdownOpen(false);
  };

  const filteredStocks = stockData.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
        {/* Current Stock Display */}
        <div className="current-stock-display">
          <span className="stock-label">Analyzing:</span>
          <span className="stock-symbol">{currentSymbol}</span>
        </div>

        {/* Stock Selector Dropdown */}
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
              <div className="dropdown-header">
                <span>Popular Stocks</span>
              </div>
              <div className="dropdown-items">
                {STOCK_SYMBOLS.map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => handleStockSelect(symbol)}
                    className={`dropdown-item ${currentSymbol === symbol ? 'selected' : ''}`}
                  >
                    <span className="item-symbol">{symbol}</span>
                    <span className="item-indicator">
                      {currentSymbol === symbol ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Search */}
        <form onSubmit={handleSearch} className="stock-search">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search stocks by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-field"
              />
            </div>
            
            {searchQuery && filteredStocks.length > 0 && (
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