'use client';

import React from 'react';
import useSWR from 'swr';

interface MacroIndicator {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  unit: string;
  category: string;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
}

interface MacroData {
  indicators: MacroIndicator[];
  summary: {
    overallSentiment: 'bullish' | 'bearish' | 'neutral';
    keyHighlights: string[];
    lastUpdated: string;
  };
}

interface MacroIndicatorsDashboardProps {
  symbol?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MacroIndicatorsDashboard({ symbol }: MacroIndicatorsDashboardProps) {
  const { data, error, isLoading } = useSWR<MacroData>(
    `/api/v1/dashboard/macro-indicators${symbol ? `?symbol=${symbol}` : ''}`,
    fetcher,
    { refreshInterval: 900000 } // 15 minutes
  );

  if (isLoading) {
    return (
      <div className="macro-dashboard-loading">
        <div className="skeleton-indicators">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-indicator"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="macro-dashboard-error">
        <div className="error-icon">📊</div>
        <h3>Macro Data Unavailable</h3>
        <p>Unable to load economic indicators</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="macro-dashboard-empty">
        <div className="empty-icon">📈</div>
        <p>Loading economic indicators...</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'var(--color-success)';
      case 'bearish': return 'var(--color-error)';
      default: return 'var(--color-warning)';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '🐂';
      case 'bearish': return '🐻';
      default: return '⚖️';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '⬆️';
      case 'down': return '⬇️';
      default: return '➡️';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'var(--color-success)';
      case 'negative': return 'var(--color-error)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(2)}%`;
    if (unit === '$B' || unit === '$T') return `$${value.toFixed(2)}${unit.slice(1)}`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className="macro-indicators-dashboard">
      {/* Market Sentiment Overview */}
      <div className="sentiment-overview">
        <div className="sentiment-badge" style={{ backgroundColor: getSentimentColor(data.summary.overallSentiment) }}>
          <span className="sentiment-icon">{getSentimentIcon(data.summary.overallSentiment)}</span>
          <span className="sentiment-text">{data.summary.overallSentiment.toUpperCase()}</span>
        </div>
        <div className="last-updated">
          Updated: {new Date(data.summary.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Key Highlights */}
      <div className="key-highlights">
        <h4>💡 Key Highlights</h4>
        <ul>
          {data.summary.keyHighlights.map((highlight, index) => (
            <li key={index}>{highlight}</li>
          ))}
        </ul>
      </div>

      {/* Indicators Grid */}
      <div className="indicators-grid">
        {data.indicators.map((indicator) => (
          <div key={indicator.id} className="indicator-card">
            <div className="indicator-header">
              <div className="indicator-name">{indicator.name}</div>
              <div className="indicator-trend">
                {getTrendIcon(indicator.trend)}
              </div>
            </div>
            
            <div className="indicator-value">
              {formatValue(indicator.value, indicator.unit)}
            </div>
            
            <div 
              className="indicator-change"
              style={{ color: getImpactColor(indicator.impact) }}
            >
              {formatChange(indicator.change, indicator.changePercent)}
            </div>
            
            <div className="indicator-meta">
              <span className="indicator-category">{indicator.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Categories Legend */}
      <div className="categories-legend">
        <div className="legend-item">
          <div className="legend-color growth"></div>
          <span>Growth Indicators</span>
        </div>
        <div className="legend-item">
          <div className="legend-color inflation"></div>
          <span>Inflation</span>
        </div>
        <div className="legend-item">
          <div className="legend-color employment"></div>
          <span>Employment</span>
        </div>
        <div className="legend-item">
          <div className="legend-color monetary"></div>
          <span>Monetary Policy</span>
        </div>
      </div>
    </div>
  );
}