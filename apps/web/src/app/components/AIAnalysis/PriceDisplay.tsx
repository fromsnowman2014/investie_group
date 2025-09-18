'use client';

import React from 'react';
import { StockMarketData } from '@/types/enhancedStockProfile';
import { formatMarketData, getPriceChangeClasses } from '@/utils/stockDataFormatters';

interface PriceDisplayProps {
  marketData: StockMarketData;
  symbol?: string;
}

export default function PriceDisplay({ marketData, symbol }: PriceDisplayProps) {
  const formatted = formatMarketData(marketData);

  return (
    <div className="price-ticker">
      <div className="price-display">
        {/* Current Price - Main focal point */}
        <div className="price-main">
          <span className="current-price">{formatted.price}</span>
          {symbol && (
            <span className="price-symbol ml-2 text-xs text-gray-500 font-medium">
              {symbol.toUpperCase()}
            </span>
          )}
        </div>

        {/* Price Changes - Compact single line */}
        <div className="price-changes">
          <span className={getPriceChangeClasses(formatted.change)}>
            <span className="change-arrow">
              {formatted.change.isPositive && '↗'}
              {formatted.change.isNegative && '↘'}
              {formatted.change.isNeutral && '→'}
            </span>
            <span className="change-value ml-1">
              {formatted.change.formatted}
            </span>
            <span className="change-percent ml-1">
              ({formatted.changePercent.formatted})
            </span>
          </span>
        </div>
      </div>

      {/* Rate Limit Warning - If applicable */}
      {marketData.alphaVantageRateLimit?.isLimited && (
        <div className="rate-limit-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            {marketData.alphaVantageRateLimit.message || 'API rate limit reached - showing cached data'}
          </span>
        </div>
      )}

      {/* Data Source Indicator - Minimal */}
      <div className="data-source">
        <span className="text-xs text-gray-400">
          {marketData.source === 'mock_data' ? 'Demo Data' : 'Live Data'}
        </span>
      </div>
    </div>
  );
}