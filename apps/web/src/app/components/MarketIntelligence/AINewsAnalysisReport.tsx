'use client';

import React, { useEffect } from 'react';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api-utils';
import { useRefresh } from '@/app/contexts/RefreshContext';

interface NewsAnalysisSummary {
  symbol: string;
  summary: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    keyPoints: string[];
    trendingTopics: string[];
    marketImpact: string;
  };
  metadata: {
    articlesAnalyzed: number;
    timeRange: string;
    lastUpdated: string;
  };
}

interface AINewsAnalysisReportProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  const response = await apiFetch(url);
  const data = await response.json();
  return data;
};

export default function AINewsAnalysisReport({ symbol }: AINewsAnalysisReportProps) {
  const { refreshTrigger } = useRefresh();
  const { data, error, isLoading, mutate } = useSWR<NewsAnalysisSummary>(
    symbol ? `/api/v1/dashboard/${symbol}/news-analysis` : null,
    fetcher,
    { refreshInterval: 600000 } // 10 minutes
  );

  // Trigger refresh when global refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      mutate();
    }
  }, [refreshTrigger, mutate]);

  if (isLoading) {
    return (
      <div className="news-analysis-loading">
        <div className="skeleton-summary">
          <div className="skeleton-header"></div>
          <div className="skeleton-points">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-point"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-analysis-error">
        <div className="error-icon">📰</div>
        <h3>News Analysis Unavailable</h3>
        <p>Unable to load news summary. Please try again later.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="news-analysis-empty">
        <div className="empty-icon">🗞️</div>
        <p>Select a stock symbol for AI news analysis</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'var(--color-success)';
      case 'negative': return 'var(--color-error)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '➖';
    }
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 70) return 'Very Positive';
    if (score >= 55) return 'Positive';
    if (score >= 45) return 'Neutral';
    if (score >= 30) return 'Negative';
    return 'Very Negative';
  };

  return (
    <div className="ai-news-summary-report">
      {/* Compact Header */}
      <div className="summary-compact-header">
        <div className="header-left">
          <h3>📊 AI News Analysis - {data.symbol}</h3>
          <span className="metadata-inline">
            {data.metadata.articlesAnalyzed} articles • {data.metadata.timeRange}
          </span>
        </div>
        <div className="ai-badge-inline">
          <span className="ai-icon">🤖</span>
          <span>AI-Generated</span>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="summary-main-grid">
        {/* Left Column: Sentiment */}
        <div className="sentiment-column">
          <div
            className="sentiment-badge-compact"
            style={{
              backgroundColor: getSentimentColor(data.summary.overallSentiment),
              color: '#fff'
            }}
          >
            {getSentimentIcon(data.summary.overallSentiment)}
            <span className="sentiment-text">
              {getSentimentLabel(data.summary.sentimentScore)}
            </span>
          </div>

          <div className="sentiment-score-compact">
            <div className="score-label">Sentiment Score</div>
            <div className="score-display">
              <div className="score-bar-container">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${data.summary.sentimentScore}%`,
                    backgroundColor: getSentimentColor(data.summary.overallSentiment)
                  }}
                ></div>
              </div>
              <span className="score-value">{data.summary.sentimentScore}/100</span>
            </div>
          </div>

          {/* Trending Topics - Moved to left column */}
          <div className="trending-topics-compact">
            <h4 className="section-title-small">🔥 Trending Topics</h4>
            <div className="topics-container-compact">
              {data.summary.trendingTopics.map((topic, index) => (
                <span key={index} className="topic-chip-small">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Insights */}
        <div className="insights-column">
          <h4 className="section-title-small">🔑 Key Insights</h4>
          <ul className="insights-list-compact">
            {data.summary.keyPoints.map((point, index) => (
              <li key={index} className="insight-item-compact">
                <span className="insight-bullet">•</span>
                <span className="insight-text">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom: Market Impact */}
      <div className="market-impact-compact">
        <strong>📊 Market Impact:</strong>
        <span className="impact-text">{data.summary.marketImpact}</span>
      </div>

      {/* Compact Footer */}
      <div className="summary-footer-compact">
        <small className="last-updated">
          Last updated: {new Date(data.metadata.lastUpdated).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </small>
      </div>
    </div>
  );
}
