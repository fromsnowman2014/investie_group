'use client';

import React from 'react';
import useSWR from 'swr';
import { debugFetch } from '@/lib/api-utils';
import FinancialExpandableSection from '../FinancialExpandableSection';

interface AIAnalysisData {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  priceChange?: number;
  priceChangePercent?: number;
  analysisDate?: string;
  keyPoints?: string[];
  risks?: string[];
  opportunities?: string[];
  timeHorizon?: string;
  investmentRating?: number; // 1-10
  // API response properties
  upside?: number;
  lastUpdated?: string;
  reasoning?: {
    bullishPoints: string[];
    bearishPoints: string[];
    keyRisks: string[];
  };
}

interface AIInvestmentOpinionProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  console.log('🤖 AI Analysis Fetcher Starting:', url);
  const response = await debugFetch(url);
  const rawData = await response.json();
  console.log('🤖 AI Analysis Raw Response:', rawData);
  
  // Extract data from the nested structure
  const apiData = rawData.success ? rawData.data : rawData;
  console.log('🤖 AI Analysis Extracted Data:', apiData);
  console.log('🔍 Checking if data has expected properties:', {
    hasCurrentPrice: 'currentPrice' in apiData,
    hasTargetPrice: 'targetPrice' in apiData,
    hasPriceChange: 'priceChange' in apiData,
    hasPriceChangePercent: 'priceChangePercent' in apiData,
    actualProperties: Object.keys(apiData)
  });
  
  // Transform the API data to match component expectations
  const transformedData: AIAnalysisData = {
    ...apiData,
    // Fill in missing properties with safe defaults or calculated values
    priceChange: apiData.priceChange ?? 0,
    priceChangePercent: apiData.priceChangePercent ?? 0,
    analysisDate: apiData.analysisDate || apiData.lastUpdated || new Date().toISOString(),
    keyPoints: apiData.keyPoints || apiData.reasoning?.bullishPoints || [],
    risks: apiData.risks || apiData.reasoning?.keyRisks || [],
    opportunities: apiData.opportunities || apiData.reasoning?.bullishPoints || [],
    timeHorizon: apiData.timeHorizon || 'Medium-term',
    investmentRating: apiData.investmentRating ?? Math.round(apiData.confidence * 10) ?? 7,
  };
  
  console.log('🔧 Transformed Data:', transformedData);
  console.log('🔍 Final data validation:', {
    currentPrice: { value: transformedData.currentPrice, type: typeof transformedData.currentPrice },
    targetPrice: { value: transformedData.targetPrice, type: typeof transformedData.targetPrice },
    priceChange: { value: transformedData.priceChange, type: typeof transformedData.priceChange },
    priceChangePercent: { value: transformedData.priceChangePercent, type: typeof transformedData.priceChangePercent }
  });
  
  return transformedData;
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

  // Debug log the entire data object and critical properties
  console.log('🤖 AIInvestmentOpinion data object:', data);
  console.log('🔍 Critical properties check:', {
    currentPrice: { value: data.currentPrice, type: typeof data.currentPrice },
    targetPrice: { value: data.targetPrice, type: typeof data.targetPrice },
    priceChange: { value: data.priceChange, type: typeof data.priceChange },
    priceChangePercent: { value: data.priceChangePercent, type: typeof data.priceChangePercent },
    confidence: { value: data.confidence, type: typeof data.confidence },
    investmentRating: { value: data.investmentRating, type: typeof data.investmentRating }
  });

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

  const formatPrice = (price: number) => {
    console.log('🔍 formatPrice called with:', { price, type: typeof price, isUndefined: price === undefined, isNull: price === null, isNaN: isNaN(price) });
    if (price === undefined || price === null || isNaN(price)) {
      console.error('❌ formatPrice: Invalid price value received:', price);
      return '$0.00';
    }
    return `$${price.toFixed(2)}`;
  };
  
  const formatPercent = (percent: number) => {
    console.log('🔍 formatPercent called with:', { percent, type: typeof percent, isUndefined: percent === undefined, isNull: percent === null, isNaN: isNaN(percent) });
    if (percent === undefined || percent === null || isNaN(percent)) {
      console.error('❌ formatPercent: Invalid percent value received:', percent);
      return '0.00%';
    }
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString();
  };

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
      <div className="recommendation-header data-density-high">
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
          <span className="time-horizon">{data.timeHorizon ?? 'Medium-term'} outlook</span>
        </div>
      </div>

      {/* Price Analysis */}
      <div className="price-analysis">
        <div className="price-card current-price">
          <div className="data-row">
            <span className="data-label">Current Price</span>
            <span className="data-value financial-data-large">
              {(() => {
                console.log('🎯 About to call formatPrice with currentPrice:', data.currentPrice);
                return formatPrice(data.currentPrice);
              })()}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Change</span>
            <span className={`data-value financial-data ${(data.priceChange ?? 0) >= 0 ? 'price-positive' : 'price-negative'}`}>
              {(() => {
                console.log('🎯 About to call formatPrice with priceChange:', data.priceChange);
                console.log('🎯 About to call formatPercent with priceChangePercent:', data.priceChangePercent);
                return `${formatPrice(data.priceChange ?? 0)} (${formatPercent(data.priceChangePercent ?? 0)})`;
              })()}
            </span>
          </div>
        </div>
        <div className="price-card target-price">
          <div className="data-row">
            <span className="data-label">Target Price</span>
            <span className="data-value financial-data-large">
              {(() => {
                console.log('🎯 About to call formatPrice with targetPrice:', data.targetPrice);
                return formatPrice(data.targetPrice);
              })()}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Upside</span>
            <span className="data-value financial-data price-positive">
              {(() => {
                const targetPrice = data.targetPrice ?? 0;
                const currentPrice = data.currentPrice ?? 0;
                const upside = currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
                console.log('🎯 About to call formatPercent with calculated upside:', upside);
                console.log('🎯 Upside calculation values - targetPrice:', targetPrice, 'currentPrice:', currentPrice);
                return formatPercent(upside);
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Investment Rating */}
      <div className="investment-rating">
        <div className="data-row">
          <span className="data-label">Investment Rating</span>
          <span className="data-value financial-data-large">{data.investmentRating ?? 7}/10</span>
        </div>
        <div className="rating-bar mt-2 h-2 bg-gray-200 rounded">
          <div 
            className="rating-fill h-full bg-blue-600 rounded transition-all duration-300"
            style={{ width: `${((data.investmentRating ?? 7) / 10) * 100}%` }}
          ></div>
        </div>
        <div className="metadata-text mt-1 text-center">{getRatingLabel(data.investmentRating ?? 7)}</div>
      </div>

      {/* Analysis Points - Using FinancialExpandableSection */}
      <FinancialExpandableSection
        title="Analysis Details"
        dataType="analysis"
        priority="important"
        initialHeight={{
          mobile: 150,
          tablet: 200,
          desktop: 250
        }}
        metrics={{
          confidence: data.confidence,
          lastUpdated: new Date(data.analysisDate)
        }}
        className="mb-4"
      >
        <div className="analysis-sections">
          <div className="analysis-section key-points mb-4">
            <h4 className="financial-title mb-2 flex items-center gap-1">
              <span>💡</span> Key Points
            </h4>
            <ul className="space-y-1">
              {(data.keyPoints ?? []).map((point, index) => (
                <li key={index} className="supporting-text">{point}</li>
              ))}
            </ul>
          </div>

          <div className="analysis-section opportunities mb-4">
            <h4 className="financial-title mb-2 flex items-center gap-1">
              <span>🚀</span> Opportunities
            </h4>
            <ul className="space-y-1">
              {(data.opportunities ?? []).map((opportunity, index) => (
                <li key={index} className="supporting-text">{opportunity}</li>
              ))}
            </ul>
          </div>

          <div className="analysis-section risks">
            <h4 className="financial-title mb-2 flex items-center gap-1">
              <span>⚠️</span> Risks
            </h4>
            <ul className="space-y-1">
              {(data.risks ?? []).map((risk, index) => (
                <li key={index} className="supporting-text">{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </FinancialExpandableSection>

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