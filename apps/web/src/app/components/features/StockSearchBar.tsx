'use client'

import React, { useState } from 'react'
import { StockSymbol } from '@/types/api'

interface StockData {
  symbol: StockSymbol
  name: string
}

interface StockSearchBarProps {
  stocks: StockData[]
  onSelect: (symbol: StockSymbol) => void
  onSearch: (query: string) => void
  className?: string
}

export function StockSearchBar({ 
  stocks, 
  onSelect, 
  onSearch, 
  className = '' 
}: StockSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleStockSelect = (symbol: StockSymbol) => {
    onSelect(symbol)
    setSearchQuery('')
  }

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <form onSubmit={handleSearch} className={`stock-search ${className}`}>
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
                onClick={() => handleStockSelect(stock.symbol)}
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
  )
}