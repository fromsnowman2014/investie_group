'use client';

import React from 'react';
import useSWR from 'swr';
import { debugFetch } from '@/lib/api-utils';

// Updated interfaces to match our actual API structure
interface HeadlineItem {
  title: string;
  source: string;
  sentiment: number;
  timestamp: string;
  summary: string;
}

interface KeyTopic {
  topic: string;
  sentiment: number;
  mentions: number;
}

interface NewsAnalysisData {
  symbol: string;
  sentiment: string;
  sentimentScore: number;
  confidence: number;
  newsCount: number;
  timeframe: string;
  keyTopics: KeyTopic[];
  headlines: HeadlineItem[];
  aiSummary: {
    mainTheme: string;
    keyInsights: string[];
    investmentImplication: string;
    riskFactors: string[];
    catalysts: string[];
  };
  lastUpdated: string;
  analysisVersion: string;
}

interface AINewsAnalysisReportProps {
  symbol: string;
}

const fetcher = async (url: string): Promise<NewsAnalysisData> => {
  console.log('📰 News Analysis Fetcher Starting:', url);
  
  try {
    const response = await debugFetch(url);
    const result = await response.json();
    console.log('📰 News Analysis Response:', result);
    
    // Handle both wrapper format {success: true, data: ...} and direct data
    let data = result.success && result.data ? result.data : result;
    
    // Ensure required fields have default values to prevent undefined errors
    data = {
      symbol: data.symbol || 'UNKNOWN',
      sentiment: data.sentiment || 'neutral',
      sentimentScore: data.sentimentScore || 0,
      confidence: data.confidence || 0,
      newsCount: data.newsCount || 0,
      timeframe: data.timeframe || '24h',
      keyTopics: Array.isArray(data.keyTopics) ? data.keyTopics : [],
      headlines: Array.isArray(data.headlines) ? data.headlines : [],
      aiSummary: data.aiSummary || {
        mainTheme: 'No analysis available',
        keyInsights: [],
        investmentImplication: 'HOLD',
        riskFactors: [],
        catalysts: []
      },
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      analysisVersion: data.analysisVersion || 'v1.0.0'
    };
    
    return data;
  } catch (error) {
    console.error('News Analysis Fetcher Error:', error);
    throw error;
  }
};

export default function AINewsAnalysisReport({ symbol }: AINewsAnalysisReportProps) {
  const { data, error, isLoading } = useSWR<NewsAnalysisData>(
    symbol ? `/api/v1/dashboard/${symbol}/news-analysis` : null,
    fetcher,
    { refreshInterval: 600000 } // 10 minutes
  );

  if (isLoading) {
    return (
      <div className="news-analysis-loading">
        <div className="skeleton-news">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-news-item"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-analysis-error">
        <div className="error-icon">📰</div>
        <h3>News Analysis Unavailable</h3>
        <p>Unable to load news analysis</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="news-analysis-empty">
        <div className="empty-icon">🗞️</div>
        <p>Select a stock symbol for news analysis</p>
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


  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      const now = new Date();
      const published = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(published.getTime())) {
        return 'Invalid date';
      }
      
      const diffMs = now.getTime() - published.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="ai-news-analysis-report">
      {/* Analytics Overview */}
      <div className="news-analytics-overview">
        <div className="analytics-header">
          <div className="sentiment-indicator">
            <span 
              className="sentiment-badge"
              style={{ backgroundColor: getSentimentColor(data.sentiment) }}
            >
              {getSentimentIcon(data.sentiment)}
              {data.sentiment.toUpperCase()}
            </span>
            <span className="sentiment-score">
              Score: {typeof data.sentimentScore === 'number' ? data.sentimentScore.toFixed(2) : '0.00'}
            </span>
            <span className="confidence-score">
              Confidence: {typeof data.confidence === 'number' ? (data.confidence * 100).toFixed(0) : '0'}%
            </span>
          </div>
          <div className="news-stats">
            <span className="stat">
              <strong>{data.newsCount}</strong> articles
            </span>
            <span className="stat">
              <strong>{data.timeframe}</strong> timeframe
            </span>
          </div>
        </div>

        {/* Key Topics */}
        <div className="trending-topics">
          <h4>🔥 Key Topics</h4>
          <div className="topics-list">
            {data.keyTopics.map((topic, index) => (
              <span 
                key={index} 
                className="topic-tag"
                style={{ 
                  backgroundColor: topic.sentiment > 0 ? 'var(--color-success-light)' : 
                                   topic.sentiment < 0 ? 'var(--color-error-light)' : 
                                   'var(--color-neutral-light)',
                  color: topic.sentiment > 0 ? 'var(--color-success)' : 
                         topic.sentiment < 0 ? 'var(--color-error)' : 
                         'var(--color-text-secondary)'
                }}
              >
                {topic.topic} ({topic.mentions})
              </span>
            ))}
          </div>
        </div>

        {/* AI Summary */}
        <div className="ai-summary">
          <h4>🤖 AI Analysis Summary</h4>
          <p className="main-theme">{data.aiSummary.mainTheme}</p>
          <div className="investment-implication">
            <strong>Investment Implication:</strong> 
            <span className={`implication ${data.aiSummary.investmentImplication.toLowerCase()}`}>
              {data.aiSummary.investmentImplication}
            </span>
          </div>
        </div>
      </div>

      {/* Headlines */}
      <div className="news-items">
        {data.headlines.map((headline, index) => {
          const sentimentType = headline.sentiment > 0.1 ? 'positive' : 
                               headline.sentiment < -0.1 ? 'negative' : 'neutral';
          return (
            <div key={index} className="news-item">
              {/* News Header */}
              <div className="news-header">
                <div className="news-meta">
                  <span className="news-source">{headline.source}</span>
                  <span className="news-time">{formatTimeAgo(headline.timestamp)}</span>
                </div>
                <div 
                  className="news-sentiment"
                  style={{ color: getSentimentColor(sentimentType) }}
                >
                  {getSentimentIcon(sentimentType)}
                  <span className="sentiment-score">
                    {typeof headline.sentiment === 'number' ? (headline.sentiment * 100).toFixed(0) : '0'}
                  </span>
                </div>
              </div>

              {/* News Content */}
              <div className="news-content">
                <h5 className="news-title">
                  {truncateText(headline.title, 80)}
                </h5>
                <p className="news-summary">
                  {truncateText(headline.summary, 150)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Insights */}
      <div className="key-insights">
        <h4>💡 Key Insights</h4>
        <ul className="insights-list">
          {data.aiSummary.keyInsights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Risk Factors & Catalysts */}
      <div className="risk-catalysts">
        <div className="risk-factors">
          <h5>⚠️ Risk Factors</h5>
          <ul>
            {data.aiSummary.riskFactors.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
        <div className="catalysts">
          <h5>🚀 Catalysts</h5>
          <ul>
            {data.aiSummary.catalysts.map((catalyst, index) => (
              <li key={index}>{catalyst}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Last Updated */}
      <div className="news-footer">
        <small>
          Last updated: {data.lastUpdated 
            ? new Date(data.lastUpdated).toLocaleString() 
            : 'N/A'
          }
        </small>
        <small>Analysis version: {data.analysisVersion || 'N/A'}</small>
      </div>

      <style jsx>{`
        .ai-news-analysis-report {
          padding: 16px;
          background: #fafbfc;
          border-radius: 8px;
          border: 1px solid #e4e7eb;
        }

        .news-analytics-overview {
          background: white;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid #f1f5f9;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .sentiment-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sentiment-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          color: white;
        }

        .sentiment-score, .confidence-score {
          font-size: 14px;
          color: #6b7280;
        }

        .news-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          font-size: 14px;
          color: #6b7280;
        }

        .trending-topics {
          margin-bottom: 16px;
        }

        .trending-topics h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #374151;
        }

        .topics-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .topic-tag {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #6b7280;
        }

        .ai-summary h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #374151;
        }

        .main-theme {
          margin: 0 0 12px 0;
          color: #4b5563;
          font-style: italic;
        }

        .investment-implication {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .implication {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }

        .implication.buy {
          background: #10b981;
          color: white;
        }

        .implication.hold {
          background: #f59e0b;
          color: white;
        }

        .implication.sell {
          background: #ef4444;
          color: white;
        }

        .news-items {
          margin-bottom: 16px;
        }

        .news-item {
          background: white;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 6px;
          border: 1px solid #f1f5f9;
        }

        .news-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .news-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .news-source {
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }

        .news-time {
          font-size: 14px;
          color: #9ca3af;
        }

        .news-sentiment {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
        }

        .news-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #1f2937;
        }

        .news-link {
          color: inherit;
          text-decoration: none;
        }

        .news-link:hover {
          color: #3b82f6;
        }

        .news-summary {
          margin: 0 0 12px 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .key-insights h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #374151;
        }

        .insights-list {
          margin: 0;
          padding-left: 20px;
        }

        .insights-list li {
          margin-bottom: 4px;
          color: #4b5563;
        }

        .risk-catalysts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .risk-factors, .catalysts {
          background: white;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #f1f5f9;
        }

        .risk-factors h5, .catalysts h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #374151;
        }

        .risk-factors ul, .catalysts ul {
          margin: 0;
          padding-left: 16px;
        }

        .risk-factors li, .catalysts li {
          margin-bottom: 4px;
          font-size: 14px;
          color: #6b7280;
        }

        .news-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        .news-footer small {
          color: #9ca3af;
          font-size: 12px;
        }

        .news-analysis-loading,
        .news-analysis-error,
        .news-analysis-empty {
          text-align: center;
          padding: 32px;
          color: #6b7280;
        }

        .skeleton-news {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-news-item {
          height: 80px;
          background: #f3f4f6;
          border-radius: 6px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .analytics-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .sentiment-indicator {
            flex-wrap: wrap;
          }

          .risk-catalysts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}