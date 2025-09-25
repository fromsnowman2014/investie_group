'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StockSymbol } from '@/types/api'
import { edgeFunctionFetcher } from '@/lib/api-utils'

interface StockData {
  symbol: StockSymbol
  name: string
  exchange?: string
  price?: number
}

interface StockSearchResponse {
  results: StockData[]
  query: string
  total: number
  source: string
}

interface StockSearchBarProps {
  stocks?: StockData[] // Make optional for backward compatibility
  onSelect: (symbol: StockSymbol) => void
  onSearch: (query: string) => void
  className?: string
}

export function StockSearchBar({
  stocks = [], // Default empty array
  onSelect,
  onSearch,
  className = ''
}: StockSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [useApiSearch, setUseApiSearch] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleStockSelect = (symbol: StockSymbol) => {
    onSelect(symbol)
    setSearchQuery('')
    setSearchResults([])
    setUseApiSearch(false)
  }

  // Simple debounce implementation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced API search function
  const apiSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      setUseApiSearch(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await edgeFunctionFetcher<StockSearchResponse>(
        'stock-search',
        { query, limit: 10 }
      )

      console.log(`🔍 API search for "${query}" returned ${response.results.length} results`)
      setSearchResults(response.results)
      setUseApiSearch(true)
    } catch (error) {
      console.error('Stock search API error:', error)
      // Fallback to local search on API failure
      setSearchResults([])
      setUseApiSearch(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const debouncedApiSearch = useCallback((query: string) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      apiSearch(query)
    }, 300)
  }, [apiSearch])

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Use API search for queries with 2+ characters
      debouncedApiSearch(searchQuery)
    } else {
      // Clear results for short queries
      setSearchResults([])
      setUseApiSearch(false)
      setIsSearching(false)
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchQuery, debouncedApiSearch])

  // Local fallback filtering (for backward compatibility)
  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Determine which results to show
  const displayResults = useApiSearch ? searchResults : filteredStocks
  const hasResults = displayResults.length > 0
  const showResults = searchQuery.length > 0 && (hasResults || isSearching)

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
        
        {showResults && (
          <div className="search-results">
            <div className="results-header">
              <span>
                {isSearching ? 'Searching...' :
                 useApiSearch ? `${displayResults.length} stocks found` : 'Search Results'}
              </span>
              {useApiSearch && (
                <span className="text-xs text-gray-500 ml-2">
                  (25,000+ stocks available)
                </span>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">Searching all stocks...</span>
              </div>
            )}

            {!isSearching && hasResults && displayResults.slice(0, 8).map(stock => (
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
                {stock.exchange && (
                  <div className="text-xs text-gray-400">{stock.exchange}</div>
                )}
              </button>
            ))}

            {!isSearching && !hasResults && searchQuery.length >= 2 && (
              <div className="text-center py-3 text-gray-500 text-sm">
                No stocks found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  )
}