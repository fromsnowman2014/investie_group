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
            {[...Array(7)].map((_, i) => (
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
      {/* Header with Sentiment */}
      <div className="summary-header">
        <div className="summary-title">
          <h3>📊 AI News Analysis - {data.symbol}</h3>
          <div className="metadata-badge">
            {data.metadata.articlesAnalyzed} articles • {data.metadata.timeRange}
          </div>
        </div>

        <div className="sentiment-section">
          <div
            className="sentiment-badge"
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
          <div className="sentiment-score-bar">
            <div className="score-label">Sentiment Score</div>
            <div className="score-bar-container">
              <div
                className="score-bar-fill"
                style={{
                  width: `${data.summary.sentimentScore}%`,
                  backgroundColor: getSentimentColor(data.summary.overallSentiment)
                }}
              ></div>
            </div>
            <div className="score-value">{data.summary.sentimentScore}/100</div>
          </div>
        </div>
      </div>

      {/* Key Insights Section */}
      <div className="key-insights-section">
        <h4 className="section-title">🔑 Key Insights</h4>
        <ul className="insights-list">
          {data.summary.keyPoints.map((point, index) => (
            <li key={index} className="insight-item">
              <span className="insight-bullet">•</span>
              <span className="insight-text">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending Topics */}
      <div className="trending-topics-section">
        <h4 className="section-title">🔥 Trending Topics</h4>
        <div className="topics-container">
          {data.summary.trendingTopics.map((topic, index) => (
            <span key={index} className="topic-chip">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Market Impact */}
      <div className="market-impact-section">
        <h4 className="section-title">📊 Market Impact Assessment</h4>
        <p className="impact-statement">{data.summary.marketImpact}</p>
      </div>

      {/* Footer */}
      <div className="summary-footer">
        <div className="ai-badge">
          <span className="ai-icon">🤖</span>
          <span>AI-Generated Summary</span>
        </div>
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
