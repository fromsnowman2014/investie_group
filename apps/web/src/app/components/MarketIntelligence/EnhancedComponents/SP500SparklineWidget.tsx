'use client';

import React from 'react';

interface SparklineDataPoint {
  timestamp: string;
  price: number;
  volume?: number;
}

interface SP500SparklineData {
  data: SparklineDataPoint[];
  currentPrice: number;
  weeklyChange: number;
  weeklyTrend: 'up' | 'down' | 'flat';
  volatility: 'low' | 'moderate' | 'high';
  marketSentiment: 'bullish' | 'neutral' | 'bearish';
  lastUpdated?: string;
  source?: string;
}

interface SP500SparklineWidgetProps {
  data: SP500SparklineData | null;
  isLoading?: boolean;
}

const SP500SparklineWidget: React.FC<SP500SparklineWidgetProps> = ({ data, isLoading }) => {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="sp500-sparkline-widget loading">
        <div className="widget-header">
          <h4>S&P 500</h4>
          <div className="loading-badge">Loading...</div>
        </div>
        <div className="sparkline-skeleton">
          <div className="price-skeleton"></div>
          <div className="chart-skeleton"></div>
        </div>
      </div>
    );
  }

  // Handle no data state
  if (!data) {
    return (
      <div className="sp500-sparkline-widget no-data">
        <div className="widget-header">
          <div className="title-section">
            <h4>S&P 500</h4>
            <div className="symbol-badge">SPY</div>
          </div>
          <div className="no-data-badge">No Data</div>
        </div>
        <div className="no-data-content">
          <div className="no-data-icon">📈</div>
          <p>S&P 500 data unavailable</p>
          <p>Please try again later</p>
        </div>
      </div>
    );
  }

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#64748b';
    }
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'bullish': return '#10B981';
      case 'bearish': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getSentimentIcon = (sentiment: string): string => {
    switch (sentiment) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      default: return '⚖️';
    }
  };

  const getVolatilityIcon = (volatility: string): string => {
    switch (volatility) {
      case 'low': return '😴';
      case 'moderate': return '😐';
      case 'high': return '🌪️';
      default: return '😐';
    }
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getDataFreshness = (lastUpdated?: string): {
    text: string;
    color: string;
    icon: string;
  } => {
    if (!lastUpdated) {
      return { text: 'Unknown', color: '#9CA3AF', icon: '❓' };
    }

    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return { text: 'Just now', color: '#10B981', icon: '🟢' };
    } else if (diffMinutes < 5) {
      return { text: `${diffMinutes}m ago`, color: '#10B981', icon: '🟢' };
    } else if (diffMinutes < 15) {
      return { text: `${diffMinutes}m ago`, color: '#F59E0B', icon: '🟡' };
    } else if (diffMinutes < 60) {
      return { text: `${diffMinutes}m ago`, color: '#EF4444', icon: '🔴' };
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return { text: `${hours}h ago`, color: '#EF4444', icon: '🔴' };
    }
  };

  const isMarketHours = (): boolean => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dayOfWeek = easternTime.getDay();
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    
    const timeInMinutes = hour * 60 + minute;
    return timeInMinutes >= 9 * 60 + 30 && timeInMinutes <= 16 * 60;
  };

  const getDataSourceBadge = (source?: string): { text: string; color: string } => {
    if (!source) return { text: 'Unknown', color: '#9CA3AF' };
    
    switch (source) {
      case 'yahoo_finance':
        return { text: 'Yahoo', color: '#8B5CF6' };
      case 'alpha_vantage':
        return { text: 'Alpha Vantage', color: '#3B82F6' };
      case 'cache':
        return { text: 'Cached', color: '#6B7280' };
      default:
        return { text: source, color: '#9CA3AF' };
    }
  };

  const trendColor = getTrendColor(data.weeklyTrend);
  const freshness = getDataFreshness(data.lastUpdated);
  const dataSource = getDataSourceBadge(data.source);
  const marketOpen = isMarketHours();

  return (
    <div className="sp500-sparkline-widget">
      <div className="widget-header">
        <div className="title-section">
          <h4>S&P 500</h4>
          <div className="symbol-badge">SPY</div>
        </div>
        <div className="data-source-section">
          <span 
            className="source-badge-header"
            style={{ backgroundColor: dataSource.color }}
          >
            {dataSource.text}
          </span>
        </div>
      </div>

      <div className="main-content">
        <div className="price-section">
          <div className="current-price">
            ${formatPrice(data.currentPrice)}
          </div>
          <div 
            className="price-change"
            style={{ color: trendColor }}
          >
            {formatChange(data.weeklyChange)}
            <span className="change-period">7D</span>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="sparkline-chart">
          <svg width="100%" height="60" viewBox="0 0 200 60">
            <defs>
              <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: trendColor, stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: trendColor, stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            {data.data && data.data.length > 0 && (() => {
              const prices = data.data.map(d => d.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceRange = maxPrice - minPrice || 1;
              
              const points = data.data.map((point, index) => {
                const x = (index / (data.data.length - 1)) * 200;
                const y = 50 - ((point.price - minPrice) / priceRange) * 40;
                return `${x},${y}`;
              }).join(' ');
              
              return (
                <>
                  <polyline
                    fill="none"
                    stroke={trendColor}
                    strokeWidth="2"
                    points={points}
                  />
                  <polygon
                    fill="url(#sparklineGradient)"
                    points={`0,50 ${points} 200,50`}
                  />
                </>
              );
            })()}
          </svg>
        </div>

        <div className="metrics-row">
          <div className="metric-item">
            <div className="metric-label">Volatility</div>
            <div className="metric-value">
              {getVolatilityIcon(data.volatility)}
              <span>{data.volatility}</span>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Sentiment</div>
            <div className="metric-value sentiment-compact">
              {getSentimentIcon(data.marketSentiment)}
              <span>{data.marketSentiment}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Status Footer */}
      <div className="status-footer">
        <div className="status-item">
          <span className="freshness-icon">{freshness.icon}</span>
          <span 
            className="freshness-text" 
            style={{ color: freshness.color }}
          >
            {freshness.text}
          </span>
        </div>
        
        <div className="status-item">
          <span className="market-indicator">
            {marketOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .sp500-sparkline-widget {
          background: white;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          padding: 14px;
          margin-bottom: 16px;
          height: 220px;
          display: flex;
          flex-direction: column;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .widget-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .symbol-badge {
          font-size: 10px;
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .price-section {
          text-align: center;
          margin-bottom: 8px;
        }

        .current-price {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }

        .price-change {
          font-size: 14px;
          font-weight: 600;
          margin-top: 4px;
        }

        .change-period {
          font-size: 11px;
          opacity: 0.7;
          margin-left: 4px;
        }

        .sparkline-chart {
          margin: 8px 0;
          padding: 8px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .metrics-row {
          display: flex;
          justify-content: space-around;
          gap: 12px;
          margin-top: 8px;
        }

        .metric-item {
          text-align: center;
          flex: 1;
        }

        .metric-label {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .sentiment-compact {
          text-transform: capitalize;
        }

        .data-source-section {
          display: flex;
          align-items: center;
        }

        .source-badge-header {
          font-size: 9px;
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .status-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
        }

        .freshness-icon {
          font-size: 10px;
        }

        .freshness-text {
          font-weight: 500;
        }

        .market-indicator {
          font-weight: 500;
          color: #374151;
        }

        .no-data-badge {
          background: #fecaca;
          color: #991b1b;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .no-data-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          text-align: center;
          color: #64748b;
          padding: 20px;
        }

        .no-data-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .no-data-content p {
          margin: 2px 0;
          font-size: 13px;
          color: #64748b;
        }

        .sentiment-section {
          display: flex;
          align-items: center;
        }

        .sentiment-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 16px;
          color: white;
          font-size: 10px;
          font-weight: 600;
        }

        .sentiment-icon {
          font-size: 12px;
        }

        .price-section {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 20px;
        }

        .current-price {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .price-change {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .change-period {
          font-size: 10px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 500;
        }


        .metrics-section {
          display: flex;
          justify-content: center;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .metric-item {
          text-align: center;
        }

        .metric-label {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .metric-value span {
          font-size: 10px;
        }

        /* Data Status Section */
        .data-status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          margin-top: 12px;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
          gap: 8px;
        }

        .data-freshness {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .freshness-icon {
          font-size: 10px;
        }

        .freshness-text {
          font-size: 10px;
          font-weight: 500;
        }

        .market-status {
          flex-grow: 1;
          text-align: center;
        }

        .market-indicator {
          font-size: 10px;
          font-weight: 500;
          color: #374151;
        }

        .data-source {
          display: flex;
          align-items: center;
        }

        .source-badge {
          font-size: 9px;
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-weight: 500;
          opacity: 0.8;
        }

        /* Loading states */
        .sp500-sparkline-widget.loading {
          opacity: 0.7;
        }

        .loading-badge {
          background: #fef3c7;
          color: #92400e;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .sparkline-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .price-skeleton {
          width: 120px;
          height: 28px;
          background: #e5e7eb;
          border-radius: 4px;
          animation: pulse 2s ease-in-out infinite;
        }

        .chart-skeleton {
          width: 200px;
          height: 60px;
          background: #e5e7eb;
          border-radius: 8px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .sp500-sparkline-widget {
            height: auto;
            min-height: 180px;
            padding: 12px;
          }

          .widget-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .price-section {
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }

          .current-price {
            font-size: 20px;
          }

          .metrics-section {
            justify-content: center;
          }

          .metric-item {
            text-align: center;
          }

          .metric-label {
            margin-bottom: 0;
          }

          .data-status-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .market-status {
            text-align: left;
          }

          .data-source {
            align-self: flex-end;
          }
        }

      `}</style>
    </div>
  );
};

export default SP500SparklineWidget;