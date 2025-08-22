'use client';

import React from 'react';
import useSWR from 'swr';
import { debugFetch } from '@/lib/api-utils';

interface AIAnalysisData {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  analysisDate: string;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  timeHorizon: string;
  investmentRating: number; // 1-10
}

interface AIInvestmentOpinionProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  console.log('🤖 AI Analysis Fetcher Starting:', url);
  const response = await debugFetch(url);
  const data = await response.json();
  console.log('🤖 AI Analysis Data:', data);
  return data;
};

export default function AIInvestmentOpinion({ symbol }: AIInvestmentOpinionProps) {
  const { data, error, isLoading } = useSWR<AIAnalysisData>(
    symbol ? `/api/v1/dashboard/${symbol}/ai-analysis` : null,
    fetcher,
    { refreshInterval: 600000 } // 10 minutes
  );

  if (isLoading) {
    return (
      <div className="ai-opinion-loading">
        <div className="skeleton-card">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
          <div className="skeleton-recommendation"></div>
          <div className="skeleton-points">
            <div className="skeleton-point"></div>
            <div className="skeleton-point"></div>
            <div className="skeleton-point"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-opinion-error">
        <div className="error-icon">🤖</div>
        <h3>AI Analysis Unavailable</h3>
        <p>Unable to load investment opinion</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ai-opinion-empty">
        <div className="empty-icon">🔍</div>
        <p>Select a stock symbol for AI analysis</p>
      </div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'var(--color-success)';
      case 'SELL': return 'var(--color-error)';
      case 'HOLD': return 'var(--color-warning)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      case 'HOLD': return '⏸️';
      default: return '🤔';
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatPercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Fair';
    if (rating >= 2) return 'Poor';
    return 'Very Poor';
  };

  return (
    <div className="ai-investment-opinion">
      {/* AI Recommendation Header */}
      <div className="recommendation-header">
        <div className="rec-badge-container">
          <div 
            className="recommendation-badge"
            style={{ backgroundColor: getRecommendationColor(data.recommendation) }}
          >
            <span className="rec-icon">{getRecommendationIcon(data.recommendation)}</span>
            <span className="rec-text">{data.recommendation}</span>
          </div>
          <div className="confidence-score">
            Confidence: {Math.round(data.confidence * 100)}%
          </div>
        </div>
        <div className="analysis-meta">
          <span className="analysis-date">{formatDate(data.analysisDate)}</span>
          <span className="time-horizon">{data.timeHorizon} outlook</span>
        </div>
      </div>

      {/* Price Analysis */}
      <div className="price-analysis">
        <div className="price-card current-price">
          <div className="price-label">Current Price</div>
          <div className="price-value">{formatPrice(data.currentPrice)}</div>
          <div className={`price-change ${data.priceChange >= 0 ? 'positive' : 'negative'}`}>
            {formatPrice(data.priceChange)} ({formatPercent(data.priceChangePercent)})
          </div>
        </div>
        <div className="price-card target-price">
          <div className="price-label">Target Price</div>
          <div className="price-value">{formatPrice(data.targetPrice)}</div>
          <div className="upside-potential">
            {formatPercent(((data.targetPrice - data.currentPrice) / data.currentPrice) * 100)} upside
          </div>
        </div>
      </div>

      {/* Investment Rating */}
      <div className="investment-rating">
        <div className="rating-header">
          <span className="rating-label">Investment Rating</span>
          <span className="rating-value">{data.investmentRating}/10</span>
        </div>
        <div className="rating-bar">
          <div 
            className="rating-fill"
            style={{ width: `${(data.investmentRating / 10) * 100}%` }}
          ></div>
        </div>
        <div className="rating-description">{getRatingLabel(data.investmentRating)}</div>
      </div>

      {/* Analysis Points */}
      <div className="analysis-sections">
        <div className="analysis-section key-points">
          <h4>💡 Key Points</h4>
          <ul>
            {data.keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-section opportunities">
          <h4>🚀 Opportunities</h4>
          <ul>
            {data.opportunities.map((opportunity, index) => (
              <li key={index}>{opportunity}</li>
            ))}
          </ul>
        </div>

        <div className="analysis-section risks">
          <h4>⚠️ Risks</h4>
          <ul>
            {data.risks.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="ai-disclaimer">
        <small>
          🤖 This analysis is AI-generated and should not be considered as financial advice. 
          Please consult with a financial advisor before making investment decisions.
        </small>
      </div>
    </div>
  );
}