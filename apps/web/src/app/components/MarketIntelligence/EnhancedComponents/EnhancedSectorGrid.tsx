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

  // Handle loading state
  if (isLoading) {
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

  // Handle no data state with mock data for demonstration
  if (!sectors || sectors.length === 0) {
    const mockSectors = [
      {
        sector: "Technology", ticker: "XLK", name: "Technology Select Sector SPDR Fund", price: 185.45, change: 2.15, changePercent: 2.1,
        volume: 12500000, marketCap: 45000000000, weeklyPerformance: 3.2, monthlyPerformance: 8.7,
        momentum: 'buy' as const, leadership: 'leader' as const, rotationSignal: 'inflow' as const,
        relativeStrength: 75, correlation: 0.85, lastUpdated: new Date().toISOString()
      },
      {
        sector: "Healthcare", ticker: "XLV", name: "Health Care Select Sector SPDR Fund", price: 142.30, change: -0.85, changePercent: -0.6,
        volume: 8200000, marketCap: 32000000000, weeklyPerformance: 0.8, monthlyPerformance: 4.2,
        momentum: 'hold' as const, leadership: 'neutral' as const, rotationSignal: 'neutral' as const,
        relativeStrength: 52, correlation: 0.65, lastUpdated: new Date().toISOString()
      },
      {
        sector: "Finance", ticker: "XLF", name: "Financial Select Sector SPDR Fund", price: 38.92, change: -0.32, changePercent: -0.8,
        volume: 15600000, marketCap: 28000000000, weeklyPerformance: -1.2, monthlyPerformance: 2.1,
        momentum: 'sell' as const, leadership: 'laggard' as const, rotationSignal: 'outflow' as const,
        relativeStrength: 35, correlation: 0.72, lastUpdated: new Date().toISOString()
      },
      {
        sector: "Energy", ticker: "XLE", name: "Energy Select Sector SPDR Fund", price: 89.15, change: 1.45, changePercent: 1.7,
        volume: 18200000, marketCap: 25000000000, weeklyPerformance: 2.8, monthlyPerformance: 6.9,
        momentum: 'buy' as const, leadership: 'leader' as const, rotationSignal: 'inflow' as const,
        relativeStrength: 68, correlation: 0.58, lastUpdated: new Date().toISOString()
      }
    ];

    // Use mock data with a notice
    return (
      <div className="enhanced-sector-grid">
        <div className="grid-header">
          <div className="title-section">
            <h4>Enhanced Sector Performance</h4>
            <div className="data-badge demo-badge">Demo Data</div>
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
          </div>
        </div>
        
        <div className="demo-notice">
          <span className="demo-icon">ℹ️</span>
          <span>Market data temporarily unavailable. Showing demo data.</span>
        </div>
        
        {renderSectorContent(mockSectors)}
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


  // Create the renderSectorContent function for reusability
  function renderSectorContent(sectorData: EnhancedSectorPerformance[]) {
    // Sort sectors based on selected criteria  
    const sortedSectors = [...sectorData].sort((a, b) => {
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
      <>
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
      </>
    );
  };


  return (
    <div className="enhanced-sector-grid">
      <div className="grid-header">
        <div className="title-section">
          <h4>Enhanced Sector Performance</h4>
          <div className="data-badge">{sectors.length} Sectors</div>
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

      {renderSectorContent(sectors)}
    </div>
  );
};

export default EnhancedSectorGrid;
