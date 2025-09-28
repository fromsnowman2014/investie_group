'use client';

import React from 'react';
import useSWR from 'swr';
import { edgeFunctionFetcher } from '@/lib/api-utils';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relevanceScore: number;
  source: string;
  publishedAt: string;
  url: string;
  topics: string[];
  impact: 'high' | 'medium' | 'low';
  aiAnalysis: {
    keyPoints: string[];
    marketImpact: string;
    tradingSignals: string[];
  };
}

interface NewsAnalysisData {
  symbol: string;
  news: NewsItem[];
  analytics: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    totalArticles: number;
    highImpactNews: number;
    trendingTopics: string[];
    lastUpdated: string;
  };
}

// Backend response type from news-analysis Edge Function
interface NewsAnalysisResponse {
  symbol: string;
  overview: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
  source: string;
  timestamp: string;
  stockNews?: {
    headline: string;
    source: string;
    articles: {
      title: string;
      link: string;
      snippet: string;
      date: string;
      source: string;
    }[];
  };
  macroNews?: {
    topHeadline: string;
    articles: {
      title: string;
      link: string;
      snippet: string;
      date: string;
      source: string;
    }[];
  };
}

interface AINewsAnalysisReportProps {
  symbol: string;
}

// Adapter function to convert backend response to frontend format
function adaptNewsAnalysisResponse(backendResponse: NewsAnalysisResponse): NewsAnalysisData {
  // Generate sentiment based on recommendation
  const getSentimentFromRecommendation = (rec: string): 'positive' | 'negative' | 'neutral' => {
    switch (rec) {
      case 'BUY': return 'positive';
      case 'SELL': return 'negative';
      default: return 'neutral';
    }
  };

  // Convert backend articles to frontend news items
  const convertArticlesToNews = (articles: { title: string; link: string; snippet: string; date: string; source: string }[]): NewsItem[] => {
    return articles.map((article, index) => ({
      id: `${article.link || index}`,
      title: article.title || '',
      summary: article.snippet || '',
      sentiment: getSentimentFromRecommendation(backendResponse.recommendation),
      sentimentScore: backendResponse.confidence / 100,
      relevanceScore: 0.8,
      source: article.source || '',
      publishedAt: article.date || new Date().toISOString(),
      url: article.link || '#',
      topics: backendResponse.keyFactors || [],
      impact: backendResponse.riskLevel === 'HIGH' ? 'high' :
             backendResponse.riskLevel === 'MEDIUM' ? 'medium' : 'low',
      aiAnalysis: {
        keyPoints: backendResponse.keyFactors || [],
        marketImpact: backendResponse.overview || '',
        tradingSignals: [backendResponse.recommendation]
      }
    }));
  };

  // Combine stock and macro news
  const allArticles = [
    ...(backendResponse.stockNews?.articles || []),
    ...(backendResponse.macroNews?.articles || [])
  ];

  const newsItems = convertArticlesToNews(allArticles);

  return {
    symbol: backendResponse.symbol,
    news: newsItems,
    analytics: {
      overallSentiment: getSentimentFromRecommendation(backendResponse.recommendation),
      sentimentScore: backendResponse.confidence / 100,
      totalArticles: allArticles.length,
      highImpactNews: backendResponse.riskLevel === 'HIGH' ? 1 : 0,
      trendingTopics: backendResponse.keyFactors || [],
      lastUpdated: backendResponse.timestamp
    }
  };
}

const fetcher = async (key: string): Promise<NewsAnalysisData> => {
  console.log('📰 News Analysis Fetcher Starting:', key);
  const [functionName, paramsJson] = key.split('|');
  const params = JSON.parse(paramsJson);

  try {
    // Try to fetch as the expected format first
    const data = await edgeFunctionFetcher<NewsAnalysisData | NewsAnalysisResponse>(functionName, params);
    console.log('📰 News Analysis Raw Data:', data);

    // Check if this is the old format (with analytics property)
    if (data && 'analytics' in data && data.analytics && 'overallSentiment' in data.analytics) {
      console.log('📰 Using legacy NewsAnalysisData format');
      return data as NewsAnalysisData;
    }

    // Otherwise, assume it's the new backend format and adapt it
    if (data && 'symbol' in data && 'recommendation' in data) {
      console.log('📰 Adapting NewsAnalysisResponse format');
      return adaptNewsAnalysisResponse(data as NewsAnalysisResponse);
    }

    // Fallback if neither format is recognized
    throw new Error('Unrecognized response format');

  } catch (error) {
    console.error('📰 News Analysis Fetcher Error:', error);
    throw error;
  }
};

export default function AINewsAnalysisReport({ symbol }: AINewsAnalysisReportProps) {
  const { data, error, isLoading } = useSWR<NewsAnalysisData>(
    symbol ? `news-analysis|${JSON.stringify({ symbol })}` : null,
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

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return { color: 'var(--color-error)', text: 'HIGH' };
      case 'medium': return { color: 'var(--color-warning)', text: 'MED' };
      default: return { color: 'var(--color-text-tertiary)', text: 'LOW' };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const published = new Date(dateString);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
              style={{ backgroundColor: getSentimentColor(data.analytics?.overallSentiment || 'neutral') }}
            >
              {getSentimentIcon(data.analytics?.overallSentiment || 'neutral')}
              {(data.analytics?.overallSentiment || 'neutral').toUpperCase()}
            </span>
            <span className="sentiment-score">
              Score: {(data.analytics?.sentimentScore || 0).toFixed(2)}
            </span>
          </div>
          <div className="news-stats">
            <span className="stat">
              <strong>{data.analytics?.totalArticles || 0}</strong> articles
            </span>
            <span className="stat">
              <strong>{data.analytics?.highImpactNews || 0}</strong> high impact
            </span>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="trending-topics">
          <h4>🔥 Trending Topics</h4>
          <div className="topics-list">
            {(data.analytics?.trendingTopics || []).map((topic, index) => (
              <span key={index} className="topic-tag">{topic}</span>
            ))}
          </div>
        </div>
      </div>

      {/* News Items */}
      <div className="news-items">
        {(data.news || []).map((newsItem) => {
          const impactBadge = getImpactBadge(newsItem.impact);
          return (
            <div key={newsItem.id} className="news-item">
              {/* News Header */}
              <div className="news-header">
                <div className="news-meta">
                  <span className="news-source">{newsItem.source}</span>
                  <span className="news-time">{formatTimeAgo(newsItem.publishedAt)}</span>
                  <span 
                    className="impact-badge"
                    style={{ backgroundColor: impactBadge.color }}
                  >
                    {impactBadge.text}
                  </span>
                </div>
                <div 
                  className="news-sentiment"
                  style={{ color: getSentimentColor(newsItem.sentiment) }}
                >
                  {getSentimentIcon(newsItem.sentiment)}
                  <span className="sentiment-score">
                    {(newsItem.sentimentScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* News Content */}
              <div className="news-content">
                <h5 className="news-title">
                  <a 
                    href={newsItem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="news-link"
                  >
                    {truncateText(newsItem.title, 80)}
                  </a>
                </h5>
                <p className="news-summary">
                  {truncateText(newsItem.summary, 150)}
                </p>

                {/* Topics */}
                <div className="news-topics">
                  {(newsItem.topics || []).slice(0, 3).map((topic, index) => (
                    <span key={index} className="topic-chip">{topic}</span>
                  ))}
                </div>

                {/* AI Analysis */}
                <div className="ai-analysis-section">
                  <div className="analysis-toggle">
                    <span className="ai-icon">🤖</span>
                    <span>AI Analysis</span>
                  </div>
                  <div className="analysis-content">
                    <div className="market-impact">
                      <strong>Market Impact:</strong> {newsItem.aiAnalysis?.marketImpact || 'No analysis available'}
                    </div>
                    {(newsItem.aiAnalysis?.keyPoints || []).length > 0 && (
                      <div className="key-points">
                        <strong>Key Points:</strong>
                        <ul>
                          {(newsItem.aiAnalysis?.keyPoints || []).slice(0, 2).map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(newsItem.aiAnalysis?.tradingSignals || []).length > 0 && (
                      <div className="trading-signals">
                        <strong>Trading Signals:</strong>
                        <div className="signals-list">
                          {(newsItem.aiAnalysis?.tradingSignals || []).slice(0, 2).map((signal, index) => (
                            <span key={index} className="signal-tag">{signal}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Updated */}
      <div className="news-footer">
        <small>Last updated: {new Date(data.analytics?.lastUpdated || new Date()).toLocaleString()}</small>
      </div>
    </div>
  );
}