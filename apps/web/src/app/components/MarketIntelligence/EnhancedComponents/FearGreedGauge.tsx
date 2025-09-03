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

  return (
    <div className="fear-greed-gauge">
      <div className="gauge-header">
        <h4>Fear & Greed Index</h4>
        <div className="data-source-badge">
          {data.source === 'claude-search' ? '🔍 Web Search' : 
           data.source === 'calculated' ? '🔬 Calculated' : '📊 Manual'}
        </div>
      </div>
      
      {/* Simplified Fear & Greed Display */}
      <div className="simple-gauge">
        <div className="gauge-value">{data.value}</div>
        <div className="status-row">
          <div className="status-info">
            <div className="gauge-status-icon">{getStatusIcon(data.status)}</div>
            <div className="status-label" style={{ color: getStatusColor(data.status) }}>
              {data.status.toUpperCase().replace('-', ' ')}
            </div>
          </div>
          <div className="confidence-score">
            {data.confidence}% confidence
          </div>
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

        .simple-gauge {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .gauge-value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 8px;
        }

        .status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 12px;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .gauge-status-icon {
          font-size: 16px;
        }

        .status-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .confidence-score {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
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

        }
      `}</style>
    </div>
  );
};

export default FearGreedGauge;