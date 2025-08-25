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

  // Create sparkline SVG path
  const createSparklinePath = (data: SparklineDataPoint[]): string => {
    if (data.length === 0) return '';
    
    const width = 200;
    const height = 60;
    const padding = 4;
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = createSparklinePath(data.data);
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

      <div className="sparkline-section">
        <div className="chart-container">
          <svg width="200" height="60" className="sparkline-chart">
            {/* Background grid lines */}
            <defs>
              <pattern id="grid" width="20" height="15" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 15" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="200" height="60" fill="url(#grid)" />
            
            {/* Sparkline path */}
            <path
              d={sparklinePath}
              fill="none"
              stroke={trendColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {data.data.map((point, index) => {
              const width = 200;
              const height = 60;
              const padding = 4;
              const prices = data.data.map(d => d.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceRange = maxPrice - minPrice || 1;
              
              const x = (index / (data.data.length - 1)) * (width - 2 * padding) + padding;
              const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={trendColor}
                  className="data-point"
                />
              );
            })}
            
            {/* Current price indicator */}
            <line
              x1="196"
              y1="0"
              x2="196"
              y2="60"
              stroke={trendColor}
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.5"
            />
          </svg>
          
          <div className="chart-labels">
            <div className="label-left">{data.data[0]?.timestamp.split('-')[1]}/{data.data[0]?.timestamp.split('-')[2]}</div>
            <div className="label-right">{data.data[data.data.length - 1]?.timestamp.split('-')[1]}/{data.data[data.data.length - 1]?.timestamp.split('-')[2]}</div>
          </div>
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
        
        <div className="metric-item">
          <div className="metric-label">7-Day Trend</div>
          <div className="metric-value" style={{ color: trendColor }}>
            {data.weeklyTrend === 'up' ? '📈' : data.weeklyTrend === 'down' ? '📉' : '➡️'}
            <span>{data.weeklyTrend.toUpperCase()}</span>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-label">Data Points</div>
          <div className="metric-value">
            📊 <span>{data.data.length}D</span>
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
          font-size: 28px;
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

        .sparkline-section {
          margin-bottom: 16px;
        }

        .chart-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sparkline-chart {
          border-radius: 8px;
          background: #fafbfc;
          border: 1px solid #e2e8f0;
        }

        .data-point {
          transition: r 0.2s ease;
        }

        .data-point:hover {
          r: 3;
          fill: #1e293b;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          width: 200px;
          margin-top: 8px;
          font-size: 10px;
          color: #64748b;
        }

        .metrics-section {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .metric-item {
          flex: 1;
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
            font-size: 24px;
          }

          .metrics-section {
            flex-direction: column;
            gap: 8px;
          }

          .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
          }

          .metric-label {
            margin-bottom: 0;
          }
        }

        @media (max-width: 480px) {
          .sparkline-chart {
            width: 100%;
            max-width: 200px;
          }

          .chart-labels {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default SP500SparklineWidget;