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
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b rounded-t-xl">
      <div className="flex items-center gap-3">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-12 bg-gray-200 rounded"></div>
        <div className="h-4 w-10 bg-gray-200 rounded"></div>
      </div>
      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
    </div>

    {/* Grid Skeleton */}
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Skeleton */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
        <div className="h-3 w-24 bg-gray-200 rounded"></div>
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
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
        message={data?.data?.error || 'Unable to load data.'}
        onRetry={() => mutate()}
      />
    );
  }

  const opinion = data.data;

  // Recommendation styling
  const recommendationStyles = {
    BUY: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-500' },
    HOLD: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500' },
    SELL: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500' }
  }[opinion.recommendation];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Parse opinion into bullet points
  const opinionPoints = opinion.opinion
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.trim().replace(/^\d+\.\s*/, '')); // Remove numbering

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className}`}>
      {/* Compact Header with all meta info */}
      <div className={`flex items-center justify-between px-4 py-3 ${recommendationStyles.bg} ${recommendationStyles.border} border-b rounded-t-xl`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${recommendationStyles.badge} rounded-full`}></div>
            <span className={`text-sm font-bold ${recommendationStyles.text}`}>
              {opinion.recommendation}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-600">
            {symbol}
          </span>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className={`text-xs font-semibold ${getConfidenceColor(opinion.confidence)}`}>
            {opinion.confidence}%
          </span>
          {opinion.timeframe && (
            <>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-xs text-gray-600">{opinion.timeframe}</span>
            </>
          )}
        </div>
        <button
          onClick={() => mutate()}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Grid Layout for Opinion Points */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {opinionPoints.map((point, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                  {index + 1}
                </span>
                <p className="text-xs text-gray-700 leading-relaxed flex-1">
                  {point}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Key Factors - Compact */}
        {opinion.keyFactors && opinion.keyFactors.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {opinion.keyFactors.map((factor, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {new Date(opinion.lastUpdated).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <span className="text-xs text-gray-400">AI Analysis by Claude</span>
        </div>
      </div>
    </div>
  );
};
