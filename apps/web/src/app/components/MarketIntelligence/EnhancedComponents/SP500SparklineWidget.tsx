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
  if (isLoading || !data) {
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
        <div className="sentiment-section">
          <div 
            className="sentiment-badge"
            style={{ backgroundColor: getSentimentColor(data.marketSentiment) }}
          >
            <span className="sentiment-icon">{getSentimentIcon(data.marketSentiment)}</span>
            <span className="sentiment-text">{data.marketSentiment.toUpperCase()}</span>
          </div>
        </div>
      </div>

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


      <div className="metrics-section">
        <div className="metric-item">
          <div className="metric-label">Volatility</div>
          <div className="metric-value">
            {getVolatilityIcon(data.volatility)}
            <span>{data.volatility.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Data Freshness and Market Status */}
      <div className="data-status-section">
        <div className="data-freshness">
          <span className="freshness-icon">{freshness.icon}</span>
          <span 
            className="freshness-text" 
            style={{ color: freshness.color }}
          >
            {freshness.text}
          </span>
        </div>
        
        <div className="market-status">
          <span className="market-indicator">
            {marketOpen ? '🟢 Market Open' : '🔴 Market Closed'}
          </span>
        </div>

        <div className="data-source">
          <span 
            className="source-badge"
            style={{ backgroundColor: dataSource.color }}
          >
            {dataSource.text}
          </span>
        </div>
      </div>

      <style jsx>{`
        .sp500-sparkline-widget {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin-bottom: 16px;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
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
            padding: 16px;
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
            font-size: 16px;
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