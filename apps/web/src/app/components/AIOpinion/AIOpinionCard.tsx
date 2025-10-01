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
  <div className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-11/12"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-10/12"></div>
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
      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
        <span className="text-red-600 text-sm font-bold">!</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">AI Analysis Error</h3>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      {message || 'An error occurred while loading AI investment opinion.'}
    </p>
    <button
      onClick={onRetry}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
    >
      Retry
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
      refreshInterval: 30 * 60 * 1000, // 30분마다 갱신
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // 10분간 중복 요청 방지
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
        message={data?.data?.error || 'Unable to load data.'}
        onRetry={() => mutate()}
      />
    );
  }

  const opinion = data.data;

  // 추천 등급에 따른 색상
  const recommendationColor = {
    BUY: 'bg-green-100 text-green-800',
    HOLD: 'bg-yellow-100 text-yellow-800',
    SELL: 'bg-red-100 text-red-800'
  }[opinion.recommendation];

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Investment Opinion
            </h3>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
        </div>

        {/* Recommendation Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${recommendationColor}`}>
          {opinion.recommendation}
        </div>
      </div>

      {/* Opinion Content */}
      <div className="space-y-3 mb-4">
        {opinion.opinion.split('\n').filter(line => line.trim()).map((line, index) => (
          <p key={index} className="text-gray-700 text-sm leading-relaxed">
            {line.trim()}
          </p>
        ))}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            Confidence:
            <span className={`font-semibold ${getConfidenceColor(opinion.confidence)}`}>
              {opinion.confidence}%
            </span>
          </span>
          {opinion.timeframe && (
            <span>Timeframe: {opinion.timeframe}</span>
          )}
        </div>

        <button
          onClick={() => mutate()}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          title="Refresh analysis"
        >
          Refresh
        </button>
      </div>

      {/* Key Factors (Collapsible) */}
      {opinion.keyFactors && opinion.keyFactors.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
            View Key Analysis Factors
          </summary>
          <div className="mt-2 space-y-2">
            {opinion.keyFactors.map((factor, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Timestamp */}
      <div className="mt-3 text-xs text-gray-400">
        Last updated: {new Date(opinion.lastUpdated).toLocaleString('en-US')}
      </div>
    </div>
  );
};
