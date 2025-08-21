'use client';

import React from 'react';
import { useMacroIndicatorsData } from '@/hooks/useMacroIndicatorsData';

interface MacroIndicatorsDashboardProps {
  symbol?: string;
}

export default function MacroIndicatorsDashboard({ symbol }: MacroIndicatorsDashboardProps) {
  const { 
    marketData: data, 
    error, 
    isLoading, 
    isEmpty, 
    isMarketOpen, 
    refetch: mutate 
  } = useMacroIndicatorsData();

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
            <div className="skeleton-line"></div>
            <div className="sectors-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="sector-item skeleton">
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
        {/* Major Indices */}
        <div className="indices-section">
          <div className="section-title">Major Indices</div>
          <div className="indices-grid">
            <div className="index-card">
              <div className="index-header">
                <div className="index-name">S&P 500</div>
                <div className="index-symbol">SPY</div>
              </div>
              <div className="index-value">{formatValue(data.indices.sp500.value)}</div>
              <div 
                className="index-change"
                style={{ color: getChangeColor(data.indices.sp500.change) }}
              >
                {formatChange(data.indices.sp500.change, data.indices.sp500.changePercent)}
              </div>
            </div>
            
            <div className="index-card">
              <div className="index-header">
                <div className="index-name">NASDAQ</div>
                <div className="index-symbol">QQQ</div>
              </div>
              <div className="index-value">{formatValue(data.indices.nasdaq.value)}</div>
              <div 
                className="index-change"
                style={{ color: getChangeColor(data.indices.nasdaq.change) }}
              >
                {formatChange(data.indices.nasdaq.change, data.indices.nasdaq.changePercent)}
              </div>
            </div>
            
            <div className="index-card">
              <div className="index-header">
                <div className="index-name">Dow Jones</div>
                <div className="index-symbol">DIA</div>
              </div>
              <div className="index-value">{formatValue(data.indices.dow.value)}</div>
              <div 
                className="index-change"
                style={{ color: getChangeColor(data.indices.dow.change) }}
              >
                {formatChange(data.indices.dow.change, data.indices.dow.changePercent)}
              </div>
            </div>
          </div>
        </div>

        {/* Sector Performance */}
        <div className="sectors-section">
          <div className="section-title">Sector Performance</div>
          <div className="sectors-grid">
            {data.sectors.map((sector, index) => (
              <div key={index} className="sector-item">
                <div className="sector-name">{sector.name}</div>
                <div 
                  className="sector-change"
                  style={{ color: getChangeColor(sector.change) }}
                >
                  {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
                </div>
                <div className="sector-indicator">
                  {sector.performance === 'positive' ? '⬆️' : '⬇️'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Metrics */}
        <div className="metrics-section">
          <div className="metric-item">
            <div className="metric-label">VIX (Volatility)</div>
            <div className="metric-value">{data.volatilityIndex.toFixed(2)}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Data Source</div>
            <div className="metric-value">{data.source === 'mock_data' ? 'Mock' : 'Live'}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">API Endpoint</div>
            <div className="metric-value" style={{fontSize: '10px', wordBreak: 'break-all'}}>
              {process.env.NEXT_PUBLIC_API_URL || 'localhost:3001'}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Environment</div>
            <div className="metric-value">{process.env.NODE_ENV}</div>
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

        .indices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .index-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .index-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .index-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .index-symbol {
          font-size: 12px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .index-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .index-change {
          font-size: 12px;
          font-weight: 500;
        }

        .sectors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .sector-item {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .sector-name {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .sector-change {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sector-indicator {
          font-size: 16px;
        }

        .metrics-section {
          display: flex;
          gap: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .metric-item {
          flex: 1;
          text-align: center;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
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

          .indices-grid {
            grid-template-columns: 1fr;
          }

          .sectors-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .metrics-section {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}