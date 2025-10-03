'use client';

import React, { useEffect } from 'react';
import useSWR from 'swr';
import { apiFetch, fetchCompanyAnalysis } from '@/lib/api-utils';
import FinancialExpandableSection from '../FinancialExpandableSection';
import { useRefresh } from '@/app/contexts/RefreshContext';

interface StockProfileData {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  description: string;
  employees: number;
  founded: string;
  headquarters: string;
  website: string;
}

interface AICompanyAnalysis {
  symbol: string;
  analysis: string[];
  timestamp: string;
}

interface StockProfileProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  const response = await apiFetch(url);
  const data = await response.json();
  return data;
};

const ANALYSIS_ICONS = ['🏢', '💰', '🎯', '⚠️', '💵'];

export default function StockProfile({ symbol }: StockProfileProps) {
  const { refreshTrigger } = useRefresh();

  // Fetch basic profile data
  const { data, error, isLoading, mutate } = useSWR<StockProfileData>(
    symbol ? `/api/v1/dashboard/${symbol}/profile` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  // Fetch AI company analysis
  const {
    data: aiAnalysisResponse,
    error: aiError,
    isLoading: aiLoading,
    mutate: mutateAI
  } = useSWR<{ success: boolean; data: AICompanyAnalysis }>(
    symbol && data ? `ai-company-${symbol}` : null,
    () => {
      const companyData = data ? {
        companyName: data.companyName,
        sector: data.sector,
        industry: data.industry,
        marketCap: data.marketCap,
        employees: data.employees
      } : undefined;
      return fetchCompanyAnalysis(symbol, companyData);
    },
    {
      refreshInterval: 30 * 60 * 1000, // 30 minutes
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
    }
  );

  // Trigger refresh when global refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      mutate();
      mutateAI();
    }
  }, [refreshTrigger, mutate, mutateAI]);

  const aiAnalysis = aiAnalysisResponse?.data;

  if (isLoading) {
    return (
      <div className="stock-profile-loading">
        <div className="skeleton-card">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
          <div className="skeleton-metrics">
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
            <div className="skeleton-metric"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-profile-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to load stock profile</h3>
        <p>Please check the symbol and try again</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="stock-profile-empty">
        <div className="empty-icon">📊</div>
        <p>Select a stock symbol to view profile</p>
      </div>
    );
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="stock-profile">
      {/* AI Company Analysis */}
      <div className="ai-company-analysis p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">

        {aiLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        )}

        {aiError && (
          <p className="text-sm text-red-600">
            ⚠️ Unable to load AI analysis.
          </p>
        )}

        {aiAnalysis && !aiLoading && (
          <div className="space-y-2">
            {aiAnalysis.analysis.map((sentence, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">
                  {ANALYSIS_ICONS[index]}
                </span>
                <p className="supporting-text text-sm leading-relaxed text-gray-800">
                  {sentence}
                </p>
              </div>
            ))}
          </div>
        )}

        {!aiAnalysis && !aiLoading && !aiError && (
          <p className="text-sm text-gray-500">Generating AI analysis...</p>
        )}
      </div>

    </div>
  );
}