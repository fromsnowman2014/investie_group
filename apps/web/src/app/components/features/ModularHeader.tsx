'use client'

import { useState, useEffect } from 'react'
import { useStock } from '../StockProvider'
import { StockSymbol } from '@/types/api'
import { getAllStocks } from '@/lib/api'
import { Logo, StockDisplay } from '../ui'
import { StockSelector, StockSearchBar } from './index'

const STOCK_SYMBOLS: StockSymbol[] = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 
  'NVDA', 'META', 'NFLX', 'AVGO', 'AMD'
]

interface StockData {
  symbol: StockSymbol
  name: string
}

export function ModularHeader() {
  const [stockData, setStockData] = useState<StockData[]>([])
  const { currentSymbol, setCurrentSymbol } = useStock()

  useEffect(() => {
    // Load stock data for the dropdown and search
    getAllStocks().then(data => {
      const formattedData = data.map(stock => ({
        symbol: stock.symbol,
        name: stock.name
      }))
      setStockData(formattedData)
    }).catch(error => {
      // Fallback to symbol list
      setStockData(STOCK_SYMBOLS.map(symbol => ({ symbol, name: symbol })))
    })
  }, [])

  const handleStockSelect = (symbol: StockSymbol) => {
    setCurrentSymbol(symbol)
  }

  const handleSearch = (query: string) => {
    // Find matching stock
    const matchingStock = stockData.find(stock => 
      stock.symbol.toLowerCase() === query.toLowerCase() ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    )
    
    if (matchingStock) {
      setCurrentSymbol(matchingStock.symbol)
    }
  }

  return (
    <header className="modern-header">
      <Logo />
      
      <div className="header-controls">
        <StockDisplay symbol={currentSymbol} />

        <StockSelector
          symbols={STOCK_SYMBOLS}
          currentSymbol={currentSymbol}
          onSelect={handleStockSelect}
        />

        <StockSearchBar
          stocks={stockData}
          onSelect={handleStockSelect}
          onSearch={handleSearch}
        />
      </div>
    </header>
  )
}