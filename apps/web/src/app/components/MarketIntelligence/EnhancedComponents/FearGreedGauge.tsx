'use client';

import React from 'react';

interface FearGreedIndexData {
  value: number;
  status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  confidence: number;
  components: {
    marketVolatility: number;
    marketVolume: number;
    marketMomentum: number;
    stockPriceBreadth: number;
    safehavenDemand: number;
    junkBondDemand: number;
    putCallRatio: number;
  };
  methodology: string;
  lastUpdated: string;
  source: string;
}

interface FearGreedGaugeProps {
  data: FearGreedIndexData | null;
  isLoading?: boolean;
}

const FearGreedGauge: React.FC<FearGreedGaugeProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="fear-greed-gauge loading">
        <div className="gauge-header">
          <h4>Fear & Greed Index</h4>
          <div className="loading-badge">Loading...</div>
        </div>
        <div className="gauge-skeleton">
          <div className="circular-skeleton"></div>
          <div className="text-skeleton"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      'extreme-fear': '#8B0000',
      'fear': '#DC2626',
      'neutral': '#F59E0B',
      'greed': '#10B981',
      'extreme-greed': '#059669'
    };
    return colors[status as keyof typeof colors] || '#F59E0B';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      'extreme-fear': '😱',
      'fear': '😨',
      'neutral': '😐',
      'greed': '😏',
      'extreme-greed': '🤑'
    };
    return icons[status as keyof typeof icons] || '😐';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (data.value / 100) * circumference;

  return (
    <div className="fear-greed-gauge">
      <div className="gauge-header">
        <h4>Fear & Greed Index</h4>
        <div className="data-source-badge">
          {data.source === 'claude-search' ? '🔍 Web Search' : 
           data.source === 'calculated' ? '🔬 Calculated' : '📊 Manual'}
        </div>
      </div>
      
      {/* Circular Progress Gauge */}
      <div className="gauge-container">
        <div className="circular-progress">
          <svg width="120" height="120" className="progress-ring">
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              stroke={getStatusColor(data.status)}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="progress-circle"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="gauge-content">
            <div className="gauge-value">{data.value}</div>
            <div className="gauge-status-icon">{getStatusIcon(data.status)}</div>
          </div>
        </div>
        
        <div className="gauge-details">
          <div className="status-label" style={{ color: getStatusColor(data.status) }}>
            {data.status.toUpperCase().replace('-', ' ')}
          </div>
          <div className="confidence-score">
            Confidence: {data.confidence}%
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="components-section">
        <button className="components-toggle" onClick={(e) => {
          const details = e.currentTarget.nextElementSibling;
          details?.classList.toggle('expanded');
        }}>
          📊 Component Analysis
        </button>
        <div className="components-details">
          <div className="components-grid">
            {Object.entries(data.components).map(([key, value]) => (
              <div key={key} className="component-item">
                <div className="component-name">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="component-bar">
                  <div 
                    className="component-fill"
                    style={{ width: `${value}%`, backgroundColor: getStatusColor(data.status) }}
                  ></div>
                </div>
                <div className="component-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology Information */}
      <div className="methodology-info">
        <div className="methodology-text">{data.methodology}</div>
        <div className="last-updated">
          Updated: {formatDate(data.lastUpdated)}
        </div>
      </div>

      <style jsx>{`
        .fear-greed-gauge {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin-bottom: 16px;
        }

        .gauge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .gauge-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .data-source-badge {
          font-size: 10px;
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .circular-progress {
          position: relative;
          margin-bottom: 16px;
        }

        .progress-ring {
          transform: rotate(-90deg);
        }

        .progress-circle {
          transition: stroke-dashoffset 1s ease-in-out;
        }

        .gauge-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .gauge-status-icon {
          font-size: 20px;
          margin-top: 4px;
        }

        .gauge-details {
          text-align: center;
        }

        .status-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }

        .confidence-score {
          font-size: 12px;
          color: #64748b;
        }

        .components-section {
          margin-bottom: 16px;
        }

        .components-toggle {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .components-toggle:hover {
          background: #f1f5f9;
        }

        .components-details {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
          background: #fafbfc;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }

        .components-details.expanded {
          max-height: 400px;
          padding: 16px;
        }

        .components-grid {
          display: grid;
          gap: 12px;
        }

        .component-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .component-name {
          font-size: 11px;
          color: #64748b;
          min-width: 100px;
          text-align: right;
        }

        .component-bar {
          flex: 1;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .component-fill {
          height: 100%;
          transition: width 0.5s ease-out;
        }

        .component-value {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          min-width: 30px;
        }

        .methodology-info {
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }

        .methodology-text {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .last-updated {
          font-size: 10px;
          color: #9ca3af;
        }

        /* Loading states */
        .fear-greed-gauge.loading {
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

        .gauge-skeleton {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .circular-skeleton {
          width: 120px;
          height: 120px;
          border: 8px solid #e5e7eb;
          border-radius: 50%;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        .text-skeleton {
          width: 80px;
          height: 16px;
          background: #e5e7eb;
          border-radius: 4px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .fear-greed-gauge {
            padding: 16px;
          }

          .components-grid {
            gap: 8px;
          }

          .component-name {
            min-width: 80px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default FearGreedGauge;