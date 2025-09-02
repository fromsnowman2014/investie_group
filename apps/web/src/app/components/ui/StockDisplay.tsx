import React from 'react'
import { StockSymbol } from '@/types/api'

interface StockDisplayProps {
  symbol: StockSymbol
  label?: string
  className?: string
}

export function StockDisplay({ 
  symbol, 
  label = 'Analyzing:', 
  className = '' 
}: StockDisplayProps) {
  return (
    <div className={`current-stock-display ${className}`}>
      <span className="stock-label">{label}</span>
      <span className="stock-symbol">{symbol}</span>
    </div>
  )
}