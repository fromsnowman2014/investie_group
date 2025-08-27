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

  const trendColor = getTrendColor(data.weeklyTrend);

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
        }

      `}</style>
    </div>
  );
};

export default SP500SparklineWidget;