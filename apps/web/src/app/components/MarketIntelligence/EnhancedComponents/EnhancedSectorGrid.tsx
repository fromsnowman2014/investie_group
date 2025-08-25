'use client';

import React, { useState } from 'react';

interface EnhancedSectorPerformance {
  sector: string;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  weeklyPerformance: number;
  monthlyPerformance: number;
  momentum: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
  leadership: 'leader' | 'laggard' | 'neutral';
  rotationSignal: 'inflow' | 'outflow' | 'neutral';
  relativeStrength: number;
  correlation: number;
  lastUpdated: string;
}

interface EnhancedSectorGridProps {
  sectors: EnhancedSectorPerformance[] | null;
  isLoading?: boolean;
}

const EnhancedSectorGrid: React.FC<EnhancedSectorGridProps> = ({ sectors, isLoading }) => {
  const [sortBy, setSortBy] = useState<'changePercent' | 'momentum' | 'leadership' | 'rotation'>('changePercent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (isLoading || !sectors) {
    return (
      <div className="enhanced-sector-grid loading">
        <div className="grid-header">
          <h4>Enhanced Sector Performance</h4>
          <div className="loading-badge">Loading...</div>
        </div>
        <div className="sectors-skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="sector-card skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-content"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPerformanceColor = (changePercent: number): string => {
    if (changePercent > 0) return '#10B981';
    if (changePercent < 0) return '#EF4444';
    return '#64748b';
  };

  const getMomentumColor = (momentum: string): string => {
    switch (momentum) {
      case 'strong-buy': return '#059669';
      case 'buy': return '#10B981';
      case 'hold': return '#F59E0B';
      case 'sell': return '#EF4444';
      case 'strong-sell': return '#DC2626';
      default: return '#64748b';
    }
  };

  const getRotationColor = (rotation: string): string => {
    switch (rotation) {
      case 'inflow': return '#10B981';
      case 'outflow': return '#EF4444';
      default: return '#64748b';
    }
  };

  const getLeadershipColor = (leadership: string): string => {
    switch (leadership) {
      case 'leader': return '#10B981';
      case 'laggard': return '#EF4444';
      default: return '#64748b';
    }
  };

  const getPerformanceIcon = (changePercent: number): string => {
    if (changePercent > 2) return '🚀';
    if (changePercent > 0) return '📈';
    if (changePercent < -2) return '📉';
    if (changePercent < 0) return '⬇️';
    return '➡️';
  };

  const getMomentumIcon = (momentum: string): string => {
    switch (momentum) {
      case 'strong-buy': return '🚀';
      case 'buy': return '⚡';
      case 'hold': return '🔄';
      case 'sell': return '🐌';
      case 'strong-sell': return '📉';
      default: return '➡️';
    }
  };

  const getRotationIcon = (rotation: string): string => {
    switch (rotation) {
      case 'inflow': return '📈';
      case 'outflow': return '📉';
      default: return '⚖️';
    }
  };

  const getLeadershipIcon = (leadership: string): string => {
    switch (leadership) {
      case 'leader': return '👑';
      case 'laggard': return '🐌';
      default: return '➡️';
    }
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    }
    return `$${marketCap}`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  // Sort sectors based on selected criteria
  const sortedSectors = [...sectors].sort((a, b) => {
    switch (sortBy) {
      case 'changePercent':
        return b.changePercent - a.changePercent;
      case 'momentum':
        const momentumOrder = { 'strong-buy': 5, 'buy': 4, 'hold': 3, 'sell': 2, 'strong-sell': 1 };
        return (momentumOrder[b.momentum] || 3) - (momentumOrder[a.momentum] || 3);
      case 'leadership':
        const leadershipOrder = { 'leader': 3, 'neutral': 2, 'laggard': 1 };
        return (leadershipOrder[b.leadership] || 2) - (leadershipOrder[a.leadership] || 2);
      case 'rotation':
        const rotationOrder = { 'inflow': 3, 'neutral': 2, 'outflow': 1 };
        return (rotationOrder[b.rotationSignal] || 2) - (rotationOrder[a.rotationSignal] || 2);
      default:
        return 0;
    }
  });

  // Find top and bottom performers
  const topPerformer = sortedSectors[0];
  const bottomPerformer = sortedSectors[sortedSectors.length - 1];

  return (
    <div className="enhanced-sector-grid">
      <div className="grid-header">
        <div className="title-section">
          <h4>Enhanced Sector Performance</h4>
          <div className="data-badge">11 Sectors</div>
        </div>
        
        <div className="controls-section">
          <div className="sort-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'changePercent' | 'momentum' | 'leadership' | 'rotation')}
              className="sort-select"
            >
              <option value="changePercent">Performance</option>
              <option value="momentum">Momentum</option>
              <option value="leadership">Leadership</option>
              <option value="rotation">Rotation</option>
            </select>
          </div>
          
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⬜
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Leadership Banner */}
      <div className="leadership-banner">
        <div className="leader-item best">
          <div className="leader-label">🏆 Top Performer</div>
          <div className="leader-content">
            <span className="leader-name">{topPerformer.name}</span>
            <span className="leader-change" style={{ color: getPerformanceColor(topPerformer.changePercent) }}>
              {formatChange(topPerformer.changePercent)}
            </span>
          </div>
        </div>
        
        <div className="leader-item worst">
          <div className="leader-label">📉 Underperformer</div>
          <div className="leader-content">
            <span className="leader-name">{bottomPerformer.name}</span>
            <span className="leader-change" style={{ color: getPerformanceColor(bottomPerformer.changePercent) }}>
              {formatChange(bottomPerformer.changePercent)}
            </span>
          </div>
        </div>
      </div>

      {/* Sectors Display */}
      <div className={`sectors-container ${viewMode}`}>
        {sortedSectors.map((sector) => (
          <div 
            key={sector.ticker} 
            className={`sector-card ${sector.name === topPerformer.name ? 'leader' : ''} ${sector.name === bottomPerformer.name ? 'laggard' : ''}`}
          >
            <div className="sector-header">
              <div className="sector-title">
                <div className="sector-name">{sector.name}</div>
                <div className="sector-symbol">{sector.ticker}</div>
              </div>
              <div 
                className="weekly-change"
                style={{ color: sector.changePercent >= 0 ? '#10B981' : '#EF4444' }}
              >
                {formatChange(sector.changePercent)}
              </div>
            </div>

            <div className="sector-metrics">
              <div className="metric-row">
                <div className="metric-item">
                  <div className="metric-label">Performance</div>
                  <div 
                    className="metric-value"
                    style={{ color: getPerformanceColor(sector.changePercent) }}
                  >
                    {getPerformanceIcon(sector.changePercent)}
                    <span>{sector.changePercent.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Momentum</div>
                  <div 
                    className="metric-value"
                    style={{ color: getMomentumColor(sector.momentum) }}
                  >
                    {getMomentumIcon(sector.momentum)}
                    <span>{sector.momentum}</span>
                  </div>
                </div>
              </div>

              <div className="metric-row">
                <div className="metric-item">
                  <div className="metric-label">Leadership</div>
                  <div 
                    className="metric-value"
                    style={{ color: getLeadershipColor(sector.leadership) }}
                  >
                    {getLeadershipIcon(sector.leadership)}
                    <span>{sector.leadership}</span>
                  </div>
                </div>

                <div className="metric-item">
                  <div className="metric-label">Rotation</div>
                  <div 
                    className="metric-value"
                    style={{ color: getRotationColor(sector.rotationSignal) }}
                  >
                    {getRotationIcon(sector.rotationSignal)}
                    <span>{sector.rotationSignal}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sector-details">
              <div className="detail-item">
                <span className="detail-label">Market Cap:</span>
                <span className="detail-value">{sector.marketCap ? formatMarketCap(sector.marketCap) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Volume:</span>
                <span className="detail-value">{formatVolume(sector.volume)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .enhanced-sector-grid {
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
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .grid-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .data-badge {
          font-size: 10px;
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .controls-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sort-select {
          font-size: 12px;
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #374151;
        }

        .view-controls {
          display: flex;
          gap: 4px;
        }

        .view-btn {
          font-size: 12px;
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #f8fafc;
        }

        .view-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .leadership-banner {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .leader-item {
          flex: 1;
          text-align: center;
        }

        .leader-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .leader-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .leader-name {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }

        .leader-change {
          font-size: 14px;
          font-weight: 700;
        }

        .sectors-container {
          display: grid;
          gap: 16px;
        }

        .sectors-container.grid {
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .sectors-container.list {
          grid-template-columns: 1fr;
        }

        .sector-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s;
          position: relative;
        }

        .sector-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sector-card.leader {
          border-color: #10B981;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        }

        .sector-card.laggard {
          border-color: #EF4444;
          background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
        }

        .sector-card.leader::before {
          content: '🏆';
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 16px;
        }

        .sector-card.laggard::before {
          content: '📉';
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 16px;
        }

        .sector-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .sector-title {
          flex: 1;
        }

        .sector-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .sector-symbol {
          font-size: 11px;
          color: #64748b;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
          display: inline-block;
        }

        .weekly-change {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .sector-metrics {
          margin-bottom: 16px;
        }

        .metric-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .metric-row:last-child {
          margin-bottom: 0;
        }

        .metric-item {
          flex: 1;
        }

        .metric-label {
          font-size: 10px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 11px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .metric-value span {
          text-transform: capitalize;
        }

        .sector-details {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-label {
          font-size: 10px;
          color: #64748b;
        }

        .detail-value {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
        }

        /* Loading states */
        .enhanced-sector-grid.loading {
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

        .sectors-skeleton {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .sector-card.skeleton {
          animation: pulse 2s ease-in-out infinite;
        }

        .skeleton-header {
          width: 70%;
          height: 16px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .skeleton-content {
          width: 100%;
          height: 80px;
          background: #e2e8f0;
          border-radius: 4px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .enhanced-sector-grid {
            padding: 16px;
          }

          .grid-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .controls-section {
            align-self: stretch;
            justify-content: space-between;
          }

          .leadership-banner {
            flex-direction: column;
            gap: 12px;
          }

          .sectors-container.grid {
            grid-template-columns: 1fr;
          }

          .sector-card {
            padding: 14px;
          }

          .metric-row {
            flex-direction: column;
            gap: 8px;
          }

          .sector-details {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedSectorGrid;