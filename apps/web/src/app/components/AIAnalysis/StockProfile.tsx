'use client';

import React from 'react';
import useSWR from 'swr';
import { debugFetch } from '@/lib/api-utils';
import FinancialExpandableSection from '../FinancialExpandableSection';

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

interface StockProfileProps {
  symbol: string;
}

const fetcher = async (url: string) => {
  const response = await debugFetch(url);
  const data = await response.json();
  return data;
};

export default function StockProfile({ symbol }: StockProfileProps) {
  const { data, error, isLoading } = useSWR<StockProfileData>(
    symbol ? `/api/v1/dashboard/${symbol}/profile` : null,
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

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

  return (
    <div className="stock-profile">
      {/* Company Header */}
      <div className="profile-header data-density-high">
        <div className="company-info mb-2">
          <h1 className="financial-title text-lg">{data.companyName}</h1>
          <div className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">{data.symbol}</div>
        </div>
        <div className="company-meta flex flex-wrap gap-2">
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.sector}</span>
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.industry}</span>
          <span className="supporting-text bg-gray-100 px-2 py-1 rounded text-xs">{data.country}</span>
        </div>
      </div>

      {/* Key Metrics - Optimized for data density */}
      <div className="key-metrics space-y-1">
        <div className="data-row">
          <span className="data-label">Market Cap</span>
          <span className="data-value financial-data">{formatMarketCap(data.marketCap)}</span>
        </div>
        <div className="data-row">
          <span className="data-label">P/E Ratio</span>
          <span className="data-value financial-data">{data.peRatio?.toFixed(2) || 'N/A'}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Dividend Yield</span>
          <span className="data-value financial-data">{data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A'}</span>
        </div>
      </div>

      {/* Company Information - Using FinancialExpandableSection */}
      <FinancialExpandableSection
        title="Company Information"
        dataType="profile"
        priority="supplementary"
        initialHeight={{
          mobile: 120,
          tablet: 150,
          desktop: 180
        }}
        className="mt-4"
      >
        <div className="company-description mb-4">
          <h4 className="financial-title mb-2">About {data.companyName}</h4>
          <p className="supporting-text leading-relaxed">{data.description}</p>
        </div>

        <div className="company-details space-y-1">
          <div className="data-row">
            <span className="data-label">Employees</span>
            <span className="data-value financial-data">{formatNumber(data.employees)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Founded</span>
            <span className="data-value financial-data">{data.founded}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Headquarters</span>
            <span className="data-value financial-data">{data.headquarters}</span>
          </div>
          {data.website && (
            <div className="data-row">
              <span className="data-label">Website</span>
              <a 
                href={data.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="data-value financial-data text-blue-600 hover:text-blue-700 transition-colors"
              >
                {data.website.replace('https://', '').replace('http://', '')}
              </a>
            </div>
          )}
        </div>
      </FinancialExpandableSection>
    </div>
  );
}