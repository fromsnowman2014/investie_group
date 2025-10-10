/**
 * Market Bubble Detector Widget
 * AI-powered comprehensive market bubble risk assessment using Claude Sonnet 4.5
 * Analyzes 10 major indicator categories to determine bubble risk
 */

'use client';

import React, { useEffect } from 'react';
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
        <div className="bubble-detector-loading">
          <div className="skeleton-card">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-subtitle"></div>
            <div className="skeleton-grid">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton-indicator"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bubble-detector-widget">
        <div className="bubble-detector-error">
          <div className="error-icon">🫧</div>
          <h3>Analysis Unavailable</h3>
          <p>Unable to load market bubble analysis</p>
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
        return '🔴 PEAK RISK';
      case 'near-peak':
        return '🟠 NEAR PEAK';
      case 'elevated':
        return '🟡 ELEVATED RISK';
      case 'normal':
      default:
        return '🟢 NORMAL';
    }
  };

  const indicatorEntries = Object.entries(data.indicators);

  return (
    <div className="bubble-detector-widget">
      <div className="bubble-detector-content">
        {/* Executive Summary */}
        <div className="bubble-summary" style={{ borderLeftColor: getVerdictColor(data.verdict) }}>
          <div className="summary-header">
            <h3 className="summary-verdict">{getVerdictLabel(data.verdict)}</h3>
            <div className="summary-date">
              Updated: {new Date(data.lastUpdated).toLocaleDateString()}
            </div>
          </div>
          <p className="summary-text">{data.verdictText}</p>
        </div>

        {/* Indicator Matrix */}
        <div className="bubble-indicators">
          <h4 className="section-title">📈 Market Indicators</h4>
          <div className="indicators-grid">
            {indicatorEntries.map(([key, indicator]) => (
              <div key={key} className="indicator-card">
                <div className="indicator-icon">{indicator.icon}</div>
                <div className="indicator-info">
                  <div className="indicator-label">
                    {key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()}
                  </div>
                  <div className="indicator-summary">{indicator.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Evidence */}
        {data.keyEvidence && data.keyEvidence.length > 0 && (
          <div className="bubble-section">
            <h4 className="section-title">🔍 Key Evidence</h4>
            <ul className="evidence-list">
              {data.keyEvidence.map((evidence, index) => (
                <li key={index}>{evidence}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Historical Context */}
        {data.historicalComparison.mostSimilarBubble !== 'none' && (
          <div className="bubble-section">
            <h4 className="section-title">📚 Historical Context</h4>
            <div className="historical-comparison">
              <div className="comparison-label">
                Most Similar: <strong>{data.historicalComparison.mostSimilarBubble}</strong>
              </div>
              {data.historicalComparison.similarities.length > 0 && (
                <div className="comparison-details">
                  <div className="comparison-subtitle">Similarities:</div>
                  <ul>
                    {data.historicalComparison.similarities.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        <div className="bubble-section">
          <h4 className="section-title">⚠️ Risk Assessment</h4>
          <div className="risk-assessment">
            <div className="risk-metric">
              <span className="risk-label">Correction Probability:</span>
              <span className="risk-value">{data.riskAssessment.correctionProbability}%</span>
            </div>
            {data.riskAssessment.vulnerableSectors.length > 0 && (
              <div className="risk-detail">
                <span className="risk-label">Vulnerable Sectors:</span>
                <span className="risk-text">
                  {data.riskAssessment.vulnerableSectors.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline (if bubble detected) */}
        {data.timeline && (
          <div className="bubble-section">
            <h4 className="section-title">📅 Timeline</h4>
            <div className="timeline-info">
              <p>
                <strong>Projected Peak:</strong> {data.timeline.projectedPeakTimeframe}
              </p>
              <p>
                <strong>Typical Duration:</strong> {data.timeline.typicalDuration}
              </p>
            </div>
          </div>
        )}

        {/* Contrarian Viewpoint */}
        {data.contrarianViewpoint && data.contrarianViewpoint.length > 0 && (
          <div className="bubble-section">
            <h4 className="section-title">🤔 Contrarian View</h4>
            <ul className="contrarian-list">
              {data.contrarianViewpoint.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div className="bubble-section bubble-recommendations">
          <h4 className="section-title">💡 Recommendations</h4>
          <div className="recommendations-grid">
            <div className="recommendation-card conservative">
              <div className="recommendation-label">Conservative</div>
              <p>{data.recommendations.conservative}</p>
            </div>
            <div className="recommendation-card moderate">
              <div className="recommendation-label">Moderate</div>
              <p>{data.recommendations.moderate}</p>
            </div>
            <div className="recommendation-card aggressive">
              <div className="recommendation-label">Aggressive</div>
              <p>{data.recommendations.aggressive}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bubble-disclaimer">
          <small>
            ⚠️ This analysis is powered by AI and is for informational purposes only. Not financial
            advice. Market conditions can change rapidly.
          </small>
        </div>
      </div>
    </div>
  );
}
