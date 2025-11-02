/**
 * Market Bubble Detector Widget - ULTRA-COMPACT VERSION
 * AI-powered comprehensive market bubble risk assessment using Claude Sonnet 4.5
 * Optimized for minimal space usage with maximum information density
 */

'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { BubbleAnalysisData } from '@/types/bubble-analysis';
import { useRefresh } from '@/app/contexts/RefreshContext';

const fetcher = async (url: string): Promise<BubbleAnalysisData> => {
  const response = await fetch(url);
  const data = await response.json();
  return data.data || data;
};

export default function BubbleDetector() {
  const { refreshTrigger } = useRefresh();
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<BubbleAnalysisData>(
    '/api/v1/bubble-analysis',
    fetcher,
    {
      refreshInterval: 1800000, // 30 minutes
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (refreshTrigger > 0) {
      mutate();
    }
  }, [refreshTrigger, mutate]);

  if (isLoading) {
    return (
      <div className="bubble-detector-widget">
        <div className="bubble-compact-loading">
          <div className="loading-spinner">🫧</div>
          <div className="loading-text">Analyzing market conditions...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bubble-detector-widget">
        <div className="bubble-compact-error">
          <div className="error-icon">🫧</div>
          <div className="error-text">Analysis Unavailable</div>
        </div>
      </div>
    );
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'peak':
        return '#ff4444';
      case 'near-peak':
        return '#ff8800';
      case 'elevated':
        return '#ffaa00';
      case 'normal':
      default:
        return '#00cc88';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'peak':
        return '🔴 PEAK';
      case 'near-peak':
        return '🟠 NEAR PEAK';
      case 'elevated':
        return '🟡 ELEVATED';
      case 'normal':
      default:
        return '🟢 NORMAL';
    }
  };

  const getIndicatorLabel = (key: string) => {
    const labels: Record<string, string> = {
      leverageCredit: 'Leverage',
      valuations: 'Valuation',
      ipoActivity: 'IPO',
      speculation: 'Speculation',
      monetaryPolicy: 'Policy',
      marketBreadth: 'Breadth',
      sentiment: 'Sentiment',
      mediaCulture: 'Media',
      historicalPatterns: 'History',
      contrarianSignals: 'Contrarian',
    };
    return labels[key] || key;
  };

  const indicatorEntries = Object.entries(data.indicators);

  return (
    <div className="bubble-detector-widget">
      <div className="bubble-compact-content">
        {/* Compact Header */}
        <div className="bubble-compact-header" style={{ borderLeftColor: getVerdictColor(data.verdict) }}>
          <div className="header-top">
            <span className="verdict-badge">{getVerdictLabel(data.verdict)}</span>
            <span className="probability-badge">{data.riskAssessment.correctionProbability}%</span>
            {data.historicalComparison.mostSimilarBubble !== 'none' && (
              <span className="historical-badge">~{data.historicalComparison.mostSimilarBubble}</span>
            )}
          </div>
          <div className="verdict-text">{data.verdictText}</div>
        </div>

        {/* Ultra-Compact Indicator Grid (5x2) */}
        <div className="bubble-compact-indicators">
          <div className="indicators-grid-compact">
            {indicatorEntries.map(([key, indicator]) => (
              <div
                key={key}
                className="indicator-chip"
                onMouseEnter={() => setHoveredIndicator(key)}
                onMouseLeave={() => setHoveredIndicator(null)}
                title={indicator.summary}
              >
                <span className="chip-icon">{indicator.icon}</span>
                <span className="chip-label">{getIndicatorLabel(key)}</span>
                {hoveredIndicator === key && (
                  <div className="indicator-tooltip">
                    <div className="tooltip-title">{getIndicatorLabel(key)}</div>
                    <div className="tooltip-content">{indicator.summary}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inline Key Evidence */}
        {data.keyEvidence && data.keyEvidence.length > 0 && (
          <div className="bubble-compact-row">
            <span className="row-icon">🔍</span>
            <div className="evidence-badges">
              {data.keyEvidence.map((evidence, index) => (
                <span key={index} className="evidence-badge">
                  {evidence}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Vulnerable Sectors */}
        {data.riskAssessment.vulnerableSectors.length > 0 && (
          <div className="bubble-compact-row">
            <span className="row-icon">⚠️</span>
            <div className="sector-chips">
              <span className="row-label">Risk:</span>
              {data.riskAssessment.vulnerableSectors.map((sector, index) => (
                <span key={index} className="sector-chip">
                  {sector}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contrarian View (if single string) */}
        {data.contrarianViewpoint && data.contrarianViewpoint.length > 0 && (
          <div className="bubble-compact-row">
            <span className="row-icon">🤔</span>
            <div className="contrarian-text">
              <span className="row-label">Bull case:</span>
              {Array.isArray(data.contrarianViewpoint)
                ? data.contrarianViewpoint[0]
                : data.contrarianViewpoint}
            </div>
          </div>
        )}

        {/* Ultra-Compact Recommendations */}
        <div className="bubble-compact-recs">
          <div className="rec-row">
            <span className="rec-icon">💡</span>
            <div className="rec-content">
              <div className="rec-item">
                <span className="rec-label">Conservative:</span>
                <span className="rec-text">{data.recommendations.conservative}</span>
              </div>
              <div className="rec-item">
                <span className="rec-label">Moderate:</span>
                <span className="rec-text">{data.recommendations.moderate}</span>
              </div>
              <div className="rec-item">
                <span className="rec-label">Aggressive:</span>
                <span className="rec-text">{data.recommendations.aggressive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="bubble-compact-footer">
          <small>AI-powered analysis • {new Date(data.lastUpdated).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  );
}
