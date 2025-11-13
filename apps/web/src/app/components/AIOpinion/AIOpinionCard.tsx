'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchAIOpinion } from '@/lib/api-utils';
import { AIOpinionResponse } from '@/types/api';

interface AIOpinionCardProps {
  symbol: string;
  className?: string;
}

const AIOpinionSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border animate-pulse">
    {/* Header Skeleton */}
    <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between mb-3">
        <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
        <div className="h-4 bg-gray-200 rounded w-10/12"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-11/12"></div>
      </div>
    </div>
  </div>
);

interface AIOpinionErrorProps {
  message?: string;
  onRetry: () => void;
}

const AIOpinionError: React.FC<AIOpinionErrorProps> = ({ message, onRetry }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-red-200">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
        <span className="text-red-600 text-lg font-bold">!</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">AI Analysis Unavailable</h3>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      {message || 'Unable to load investment opinion. Please try again.'}
    </p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Retry Analysis
    </button>
  </div>
);

export const AIOpinionCard: React.FC<AIOpinionCardProps> = ({
  symbol,
  className = ''
}) => {
  const { data, error, isLoading, mutate } = useSWR<AIOpinionResponse>(
    symbol ? `ai-opinion-${symbol}` : null,
    () => fetchAIOpinion(symbol),
    {
      refreshInterval: 30 * 60 * 1000,
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
    }
  );

  if (isLoading) {
    return <AIOpinionSkeleton />;
  }

  if (error) {
    return <AIOpinionError onRetry={() => mutate()} />;
  }

  if (!data?.success || !data?.data) {
    return (
      <AIOpinionError
        message={data?.data?.error || 'No analysis data available.'}
        onRetry={() => mutate()}
      />
    );
  }

  const opinion = data.data;

  // Recommendation styling
  const recommendationStyles = {
    BUY: {
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: '📈'
    },
    HOLD: {
      gradient: 'from-yellow-500 to-amber-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: '⏸️'
    },
    SELL: {
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: '📉'
    }
  }[opinion.recommendation];

  const getConfidenceLevel = (confidence: number): { label: string; color: string } => {
    if (confidence >= 80) return { label: 'High Confidence', color: 'text-green-600' };
    if (confidence >= 60) return { label: 'Moderate Confidence', color: 'text-yellow-600' };
    return { label: 'Low Confidence', color: 'text-red-600' };
  };

  const confidenceLevel = getConfidenceLevel(opinion.confidence);

  // Parse and categorize opinion points
  const opinionPoints = opinion.opinion
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim().replace(/^\d+\.\s*/, ''))
    .filter(line => line.length > 0);

  // Simple categorization based on keywords
  const categorizePoint = (point: string): 'bullish' | 'bearish' | 'neutral' => {
    const bullishKeywords = ['strong', 'growth', 'positive', 'increase', 'upside', 'opportunity', 'momentum', 'success', 'expansion', 'improved'];
    const bearishKeywords = ['risk', 'concern', 'decline', 'weak', 'pressure', 'challenge', 'vulnerable', 'downside', 'uncertainty', 'caution'];

    const lowerPoint = point.toLowerCase();
    const hasBullish = bullishKeywords.some(kw => lowerPoint.includes(kw));
    const hasBearish = bearishKeywords.some(kw => lowerPoint.includes(kw));

    if (hasBullish && !hasBearish) return 'bullish';
    if (hasBearish && !hasBullish) return 'bearish';
    return 'neutral';
  };

  const categorizedPoints = {
    bullish: opinionPoints.filter(p => categorizePoint(p) === 'bullish'),
    bearish: opinionPoints.filter(p => categorizePoint(p) === 'bearish'),
    neutral: opinionPoints.filter(p => categorizePoint(p) === 'neutral')
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`}>
      {/* Executive Summary Header */}
      <div className={`px-6 py-4 border-b ${recommendationStyles.bg} ${recommendationStyles.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${recommendationStyles.gradient} text-white shadow-md`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{recommendationStyles.icon}</span>
                <span className="font-bold text-lg">{opinion.recommendation}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${confidenceLevel.color}`}>
                {confidenceLevel.label}
              </span>
              <span className="text-xs text-gray-500">
                {opinion.confidence}% confidence
              </span>
            </div>
          </div>
          <button
            onClick={() => mutate()}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="Refresh analysis"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-700">Symbol:</span>
            <span className="font-semibold">{symbol}</span>
          </div>
          {opinion.timeframe && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-700">Timeframe:</span>
                <span>{opinion.timeframe}</span>
              </div>
            </>
          )}
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-700">Updated:</span>
            <span>
              {new Date(opinion.lastUpdated).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Investment Thesis */}
      <div className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Investment Thesis
        </h3>

        <div className="space-y-4">
          {/* Bullish Factors */}
          {categorizedPoints.bullish.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                <span>✓</span>
                Bullish Factors
              </h4>
              <div className="space-y-2">
                {categorizedPoints.bullish.map((point, index) => (
                  <div key={`bullish-${index}`} className="flex items-start gap-3 pl-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bearish Factors */}
          {categorizedPoints.bearish.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                <span>⚠</span>
                Risk Considerations
              </h4>
              <div className="space-y-2">
                {categorizedPoints.bearish.map((point, index) => (
                  <div key={`bearish-${index}`} className="flex items-start gap-3 pl-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Neutral/Other Points */}
          {categorizedPoints.neutral.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <span>ℹ</span>
                Additional Considerations
              </h4>
              <div className="space-y-2">
                {categorizedPoints.neutral.map((point, index) => (
                  <div key={`neutral-${index}`} className="flex items-start gap-3 pl-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key Factors */}
        {opinion.keyFactors && opinion.keyFactors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Factors</h4>
            <div className="flex flex-wrap gap-2">
              {opinion.keyFactors.map((factor, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>AI Analysis by Claude</span>
            <span>
              This is AI-generated analysis and not financial advice
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
