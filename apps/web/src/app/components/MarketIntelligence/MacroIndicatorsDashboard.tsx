'use client';

import React from 'react';
import { useMacroIndicatorsData } from '@/hooks/useMacroIndicatorsData';

interface MacroIndicatorsDashboardProps {
  symbol?: string;
}

export default function MacroIndicatorsDashboard({ }: MacroIndicatorsDashboardProps) {
  const {
    data,
    error,
    isLoading,
    refresh: mutate
  } = useMacroIndicatorsData();

  // Market is open during standard trading hours (9:30 AM - 4:00 PM ET)
  const now = new Date();
  const hour = now.getHours();
  const isMarketOpen = hour >= 9 && hour < 16;

  // Enhanced debug logging for deployment troubleshooting
  React.useEffect(() => {
    console.group('📊 MacroIndicators Component Debug');
    console.log('🔄 Loading State:', isLoading);
    console.log('📦 Has Data:', !!data);
    console.log('❌ Has Error:', !!error);
    console.log('💥 Error Message:', error?.message);
    console.log('🕐 Market Open:', isMarketOpen);
    console.log('🌍 API URL from ENV:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🏗️ Environment:', process.env.NODE_ENV);
    
    // Critical debugging: Check data source
    if (data) {
      console.log('📊 Data Source:', data.source);
      console.log('🎯 Data Sample:', {
        sp500Value: data.indices?.sp500?.value,
        sectorsCount: data.sectors?.length,
        volatilityIndex: data.volatilityIndex
      });
      
      if (data.source === 'mock_data') {
        console.warn('⚠️ Still getting mock data from backend');
      } else if (data.source === 'alpha_vantage') {
        console.log('✅ Getting real Alpha Vantage data from Railway');
      }
    }
    
    // Window and environment debug info
    if (typeof window !== 'undefined') {
      console.log('🌐 Current Origin:', window.location.origin);
      console.log('🔗 Full URL:', window.location.href);
      console.log('📱 User Agent:', navigator.userAgent.substring(0, 50) + '...');
    }
    
    console.groupEnd();
  }, [isLoading, data, error, isMarketOpen]);

  if (isLoading) {
    return (
      <div className="macro-dashboard">
        <div className="macro-header">
          <h3 className="macro-title">
            📊 Market Overview
          </h3>
          <div className="market-status loading">
            Loading...
          </div>
        </div>
        <div className="macro-content loading">
          <div className="indices-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="index-card skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))}
          </div>
          <div className="sectors-section">
            <div className="sectors-compact skeleton">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="sector-chip skeleton">
                  <div className="skeleton-line short"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="macro-dashboard error">
        <div className="macro-header">
          <h3 className="macro-title">📊 Market Overview</h3>
          <div className="market-status error">
            API Error
          </div>
        </div>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h4>Market Data Unavailable</h4>
          <p>Unable to fetch market overview</p>
          <p className="error-details">{error.message}</p>
          
          {/* Debug information for deployed environment */}
          <div className="debug-info">
            <h5>Debug Info:</h5>
            <div className="debug-item">
              <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'undefined'}
            </div>
            <div className="debug-item">
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div className="debug-item">
              <strong>Market Open:</strong> {isMarketOpen ? 'Yes' : 'No'}
            </div>
            <div className="debug-item">
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </div>
          </div>
          
          <button 
            className="retry-button"
            onClick={() => mutate()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="macro-dashboard">
        <div className="macro-header">
          <h3 className="macro-title">📊 Market Overview</h3>
          <div className="market-status">
            No Data
          </div>
        </div>
        <div className="empty-content">
          <div className="empty-icon">📈</div>
          <p>Market data not available</p>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '#10b981'; // green
      case 'bearish': return '#ef4444'; // red
      default: return '#f59e0b'; // orange
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      default: return '⚖️';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#10b981' : '#ef4444';
  };

  return (
    <div className="macro-dashboard">
      {/* Header with Market Sentiment and Status */}
      <div className="macro-header">
        <h3 className="macro-title">
          📊 Market Overview
        </h3>
        <div className="header-right">
          <div 
            className="market-sentiment-badge"
            style={{ backgroundColor: getSentimentColor(data.marketSentiment) }}
          >
            <span className="sentiment-icon">{getSentimentIcon(data.marketSentiment)}</span>
            <span className="sentiment-text">{data.marketSentiment.toUpperCase()}</span>
          </div>
          <div className={`market-status ${isMarketOpen ? 'open' : 'closed'}`}>
            {isMarketOpen ? '🟢 Open' : '🔴 Closed'}
          </div>
        </div>
      </div>

      <div className="macro-content">
        {/* Major Indices - Compact Layout */}
        <div className="indices-section">
          <div className="indices-compact">
            <div className="index-row">
              <div className="index-info">
                <span className="index-name">S&P 500</span>
                <span className="index-symbol">SPY</span>
              </div>
              <div className="index-metrics">
                <span className="index-value">{formatValue(data.indices.sp500.value)}</span>
                <span 
                  className="index-change"
                  style={{ color: getChangeColor(data.indices.sp500.change) }}
                >
                  {formatChange(data.indices.sp500.change, data.indices.sp500.changePercent)}
                </span>
              </div>
            </div>
            
            <div className="index-row">
              <div className="index-info">
                <span className="index-name">NASDAQ</span>
                <span className="index-symbol">QQQ</span>
              </div>
              <div className="index-metrics">
                <span className="index-value">{formatValue(data.indices.nasdaq.value)}</span>
                <span 
                  className="index-change"
                  style={{ color: getChangeColor(data.indices.nasdaq.change) }}
                >
                  {formatChange(data.indices.nasdaq.change, data.indices.nasdaq.changePercent)}
                </span>
              </div>
            </div>
            
            <div className="index-row">
              <div className="index-info">
                <span className="index-name">Dow Jones</span>
                <span className="index-symbol">DIA</span>
              </div>
              <div className="index-metrics">
                <span className="index-value">{formatValue(data.indices.dow.value)}</span>
                <span 
                  className="index-change"
                  style={{ color: getChangeColor(data.indices.dow.change) }}
                >
                  {formatChange(data.indices.dow.change, data.indices.dow.changePercent)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sector Performance - Ultra Compact */}
        <div className="sectors-section">
          <div className="sectors-compact">
            {data.sectors.slice(0, 8).map((sector, index) => (
              <div key={index} className="sector-chip">
                <span className="sector-name">{sector.name.split(' ')[0]}</span>
                <span 
                  className="sector-change"
                  style={{ color: getChangeColor(sector.change) }}
                >
                  {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                </span>
                <span className="sector-indicator">
                  {sector.performance === 'positive' ? '↗' : '↘'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Metrics - Extended */}
        <div className="metrics-section">
          <div className="metric-chip">
            <span className="metric-label">VIX</span>
            <span className="metric-value">{data.volatilityIndex.toFixed(1)}</span>
          </div>
          <div className="metric-chip">
            <span className="metric-label">Fear & Greed</span>
            <span className="metric-value">-</span>
          </div>
          <div className="metric-chip">
            <span className="metric-label">10Y Treasury</span>
            <span className="metric-value">-</span>
          </div>
          <div className="metric-chip">
            <span className="metric-label">CPI</span>
            <span className="metric-value">-</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .macro-dashboard {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin-bottom: 20px;
        }

        .macro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .macro-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .market-sentiment-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .market-status {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
        }

        .market-status.open {
          background: #dcfce7;
          color: #166534;
        }

        .market-status.closed {
          background: #fef2f2;
          color: #991b1b;
        }

        .market-status.loading {
          background: #fef3c7;
          color: #92400e;
        }

        .market-status.error {
          background: #fef2f2;
          color: #991b1b;
        }

        .macro-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }

        .indices-compact {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .index-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .index-row:last-child {
          border-bottom: none;
        }

        .index-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .index-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .index-symbol {
          font-size: 11px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .index-metrics {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .index-value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .index-change {
          font-size: 12px;
          font-weight: 500;
        }

        .sectors-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .sector-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 11px;
          white-space: nowrap;
        }

        .sector-name {
          font-weight: 600;
          color: #374151;
        }

        .sector-change {
          font-weight: 600;
        }

        .sector-indicator {
          font-size: 10px;
          opacity: 0.8;
        }

        .metrics-section {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .metric-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
        }

        .metric-label {
          font-weight: 500;
          color: #6b7280;
        }

        .metric-value {
          font-weight: 600;
          color: #1e293b;
        }

        /* Loading states */
        .macro-content.loading {
          opacity: 0.6;
        }

        .skeleton {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .skeleton-line {
          height: 16px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skeleton-line.short {
          width: 60%;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }

        /* Error state */
        .macro-dashboard.error {
          border-color: #fecaca;
        }

        .error-content {
          text-align: center;
          padding: 20px;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .error-content h4 {
          font-size: 16px;
          color: #dc2626;
          margin-bottom: 8px;
        }

        .error-content p {
          color: #6b7280;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .error-details {
          font-size: 12px;
          color: #9ca3af;
          font-family: monospace;
          background: #f9fafb;
          padding: 8px;
          border-radius: 4px;
          margin: 8px 0;
        }

        .retry-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          margin-top: 8px;
        }

        .retry-button:hover {
          background: #2563eb;
        }

        /* Debug information styles */
        .debug-info {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin: 12px 0;
          font-size: 11px;
        }

        .debug-info h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #374151;
          font-weight: 600;
        }

        .debug-item {
          margin-bottom: 4px;
          color: #6b7280;
          font-family: monospace;
        }

        .debug-item strong {
          color: #374151;
          font-weight: 600;
        }

        /* Empty state */
        .empty-content {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .macro-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-right {
            align-self: stretch;
            justify-content: space-between;
          }

          .indices-compact {
            padding: 12px;
          }
          
          .index-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .index-metrics {
            align-self: flex-end;
            gap: 8px;
          }

          .sectors-compact {
            padding: 8px;
            gap: 4px;
          }

          .sector-chip {
            font-size: 10px;
            padding: 3px 6px;
          }

          .metrics-section {
            gap: 6px;
            padding: 8px;
          }

          .metric-chip {
            font-size: 11px;
            padding: 5px 8px;
          }
        }
      `}</style>
    </div>
  );
}