'use client'

import React, { useState } from 'react'
import { StockSymbol } from '@/types/api'

interface StockSelectorProps {
  symbols: StockSymbol[]
  currentSymbol: StockSymbol
  onSelect: (symbol: StockSymbol) => void
  className?: string
}

export function StockSelector({ 
  symbols, 
  currentSymbol, 
  onSelect, 
  className = '' 
}: StockSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleStockSelect = (symbol: StockSymbol) => {
    onSelect(symbol)
    setIsDropdownOpen(false)
  }

  return (
    <div className={`stock-selector ${className}`}>
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
            {symbols.map(symbol => (
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
  )
}