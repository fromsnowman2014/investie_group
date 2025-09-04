'use client';

import React from 'react';

interface InterestRateData {
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  basisPointsChange: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  source: string;
  aiOutlook?: string;
}

interface CPIData {
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  monthOverMonth: number;
  yearOverYear: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  direction: 'up' | 'down' | 'stable';
  inflationPressure: 'low' | 'moderate' | 'high';
  source: string;
}

interface UnemploymentData {
  value: number;
  previousValue: number;
  change: number;
  percentChange: number;
  monthOverMonth: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  employmentHealth: 'strong' | 'moderate' | 'weak';
  source: string;
}

interface EconomicIndicatorsData {
  interestRate: InterestRateData | null;
  cpi: CPIData | null;
  unemployment: UnemploymentData | null;
}

interface EconomicIndicatorsGridProps {
  data: EconomicIndicatorsData | null;
  isLoading?: boolean;
}

const EconomicIndicatorsGrid: React.FC<EconomicIndicatorsGridProps> = ({ data, isLoading }) => {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="economic-indicators-grid loading">
        <div className="grid-header">
          <h4>Economic Indicators</h4>
          <div className="loading-badge">Loading...</div>
        </div>
        <div className="indicators-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="indicator-card skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-value"></div>
              <div className="skeleton-change"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle no data state with fallback
  if (!data) {
    return (
      <div className="economic-indicators-grid no-data">
        <div className="grid-header">
          <h4>Economic Indicators</h4>
          <div className="no-data-badge">No Data</div>
        </div>
        <div className="no-data-message">
          <div className="no-data-icon">📊</div>
          <p>Economic data is temporarily unavailable.</p>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'rising': return '#EF4444';
      case 'falling': return '#10B981';
      default: return '#F59E0B';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'rising': return '📈';
      case 'falling': return '📉';
      default: return '➡️';
    }
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'strong': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'weak': return '#EF4444';
      default: return '#64748b';
    }
  };

  const getPressureColor = (pressure: string): string => {
    switch (pressure) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#64748b';
    }
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatBasisPoints = (bps: number): string => {
    const sign = bps >= 0 ? '+' : '';
    return `${sign}${bps} bps`;
  };

  return (
    <div className="economic-indicators-grid">
      <div className="grid-header">
        <h4>Economic Indicators</h4>
        <div className="data-source">FRED API</div>
      </div>

      <div className="indicators-grid">
        {/* Interest Rate Card */}
        {data.interestRate && (
          <div className="indicator-card interest-rate">
            <div className="card-header">
              <div className="indicator-icon">📊</div>
              <div className="indicator-title">10Y Treasury</div>
              <div className="trend-icon">{getTrendIcon(data.interestRate.trend)}</div>
            </div>
            
            <div className="card-body">
              <div className="primary-value">
                {data.interestRate.value.toFixed(2)}%
              </div>
              
              <div className="change-info">
                <div 
                  className="change-value"
                  style={{ color: getTrendColor(data.interestRate.trend) }}
                >
                  {formatChange(data.interestRate.change)}%
                </div>
                <div className="basis-points">
                  {formatBasisPoints(data.interestRate.basisPointsChange)}
                </div>
              </div>
              
            </div>

            <div className="card-footer">
              <span className="trend-label" style={{ color: getTrendColor(data.interestRate.trend) }}>
                {data.interestRate.trend.toUpperCase()}
              </span>
              <span className="update-date">{data.interestRate.date}</span>
            </div>
          </div>
        )}

        {/* CPI Card */}
        {data.cpi && (
          <div className="indicator-card cpi">
            <div className="card-header">
              <div className="indicator-icon">📈</div>
              <div className="indicator-title">CPI</div>
              <div className="trend-icon">{getTrendIcon(data.cpi.trend)}</div>
            </div>
            
            <div className="card-body">
              <div className="primary-value">
                {data.cpi.value.toFixed(1)}
              </div>
              
              <div className="change-info">
                <div className="change-row">
                  <span className="change-label">M/M:</span>
                  <span 
                    className="change-value"
                    style={{ color: getTrendColor(data.cpi.trend) }}
                  >
                    {formatChange(data.cpi.monthOverMonth)}%
                  </span>
                </div>
                <div className="change-row">
                  <span className="change-label">Y/Y:</span>
                  <span 
                    className="change-value"
                    style={{ color: getTrendColor(data.cpi.trend) }}
                  >
                    {formatChange(data.cpi.yearOverYear)}%
                  </span>
                </div>
              </div>
              
            </div>

            <div className="card-footer">
              <span className="trend-label" style={{ color: getTrendColor(data.cpi.trend) }}>
                {data.cpi.direction.toUpperCase()}
              </span>
              <span className="update-date">{data.cpi.date}</span>
            </div>
          </div>
        )}

        {/* Unemployment Card */}
        {data.unemployment && (
          <div className="indicator-card unemployment">
            <div className="card-header">
              <div className="indicator-icon">👥</div>
              <div className="indicator-title">Unemployment</div>
              <div className="trend-icon">{getTrendIcon(data.unemployment.trend)}</div>
            </div>
            
            <div className="card-body">
              <div className="primary-value">
                {data.unemployment.value.toFixed(1)}%
              </div>
              
              <div className="change-info">
                <div 
                  className="change-value"
                  style={{ color: data.unemployment.trend === 'falling' ? '#10B981' : '#EF4444' }}
                >
                  {formatChange(data.unemployment.monthOverMonth)}% M/M
                </div>
              </div>
              
            </div>

            <div className="card-footer">
              <span className="trend-label" style={{ color: data.unemployment.trend === 'falling' ? '#10B981' : '#EF4444' }}>
                {data.unemployment.trend.toUpperCase()}
              </span>
              <span className="update-date">{data.unemployment.date}</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .economic-indicators-grid {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          margin-bottom: 16px;
        }

        .grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .grid-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .loading-badge {
          background: #fef3c7;
          color: #92400e;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .no-data-badge {
          background: #fecaca;
          color: #991b1b;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .no-data-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #64748b;
        }

        .no-data-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }

        .no-data-message p {
          margin: 4px 0;
          font-size: 14px;
          color: #64748b;
        }

        .data-source {
          font-size: 10px;
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .indicators-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }

        .indicator-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .indicator-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .indicator-icon {
          font-size: 16px;
        }

        .indicator-title {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          flex: 1;
          margin-left: 6px;
        }

        .trend-icon {
          font-size: 14px;
        }

        .card-body {
          margin-bottom: 8px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .primary-value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .change-info {
          margin-bottom: 6px;
        }

        .change-value {
          font-size: 14px;
          font-weight: 600;
        }

        .basis-points {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .change-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .change-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }


        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 6px;
          border-top: 1px solid #f1f5f9;
          margin-top: auto;
        }

        .trend-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .update-date {
          font-size: 9px;
          color: #9ca3af;
        }

        /* Loading states */
        .economic-indicators-grid.loading {
          opacity: 0.7;
        }

        .skeleton {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .skeleton-header {
          height: 20px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 12px;
          width: 60%;
        }

        .skeleton-value {
          height: 32px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 8px;
          width: 40%;
        }

        .skeleton-change {
          height: 16px;
          background: #e2e8f0;
          border-radius: 4px;
          width: 50%;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .economic-indicators-grid {
            padding: 16px;
          }

          .indicators-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .indicator-card {
            padding: 12px;
            min-height: 100px;
          }

          .primary-value {
            font-size: 16px;
          }

          .grid-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .indicators-grid {
            gap: 10px;
          }

          .indicator-card {
            padding: 10px;
            min-height: 90px;
          }
        }

        @media (max-width: 480px) {
          .primary-value {
            font-size: 16px;
          }

        }
      `}</style>
    </div>
  );
};

export default EconomicIndicatorsGrid;