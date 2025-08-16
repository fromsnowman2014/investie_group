'use client';

import { useState, useEffect } from 'react';
import { useStock } from './StockProvider';
import { StockSymbol } from '@/types/api';
import { getAllStocks } from '@/lib/api';

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
    <header className="header">
      <a href="#" className="site-logo">
        Investie the intern
      </a>
      
      <div className="flex items-center gap-4">
        {/* Stock Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currentSymbol}
            <svg className="ml-2 h-4 w-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <div className="py-1">
                {STOCK_SYMBOLS.map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => handleStockSelect(symbol)}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                      currentSymbol === symbol ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="search"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full"
            />
            {searchQuery && filteredStocks.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-20">
                {filteredStocks.slice(0, 5).map(stock => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => {
                      setCurrentSymbol(stock.symbol);
                      setSearchQuery('');
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="font-medium">{stock.symbol}</span>
                    {stock.name && stock.name !== stock.symbol && (
                      <span className="text-gray-500 ml-2">{stock.name}</span>
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