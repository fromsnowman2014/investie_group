import { useState, useEffect } from 'react'
import { getAllStocks } from '@/lib/stock-data'
import { StockSymbol } from '@/types/api'

interface StockData {
  symbol: StockSymbol
  name: string
}

interface UseStockDataLoaderState {
  stockData: StockData[]
  isLoading: boolean
  error: Error | null
  reload: () => Promise<void>
}

const STOCK_SYMBOLS: StockSymbol[] = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 
  'NVDA', 'META', 'NFLX', 'AVGO', 'AMD'
]

export function useStockDataLoader(): UseStockDataLoaderState {
  const [stockData, setStockData] = useState<StockData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadStockData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getAllStocks()
      
      // Data is already in the correct format
      const formattedData = data
      
      setStockData(formattedData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load stock data'))
      
      // Fallback to symbol list
      setStockData(STOCK_SYMBOLS.map(symbol => ({ symbol, name: symbol })))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStockData()
  }, [])

  return {
    stockData,
    isLoading,
    error,
    reload: loadStockData
  }
}

// Hook for filtering and searching stocks
export function useStockSearch(stocks: StockData[], query: string) {
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setFilteredStocks([])
      return
    }

    const filtered = stocks.filter(stock =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5) // Limit to 5 results

    setFilteredStocks(filtered)
  }, [stocks, query])

  return filteredStocks
}

// Hook for finding stock by symbol or name
export function useStockMatcher(stocks: StockData[]) {
  const findStock = (query: string): StockData | null => {
    return stocks.find(stock => 
      stock.symbol.toLowerCase() === query.toLowerCase() ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    ) || null
  }

  return { findStock }
}