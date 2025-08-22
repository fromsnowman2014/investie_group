'use client';

import React from 'react';
import useSWR from 'swr';
import { debugFetch } from '@/lib/api-utils';

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
  console.log('📊 Stock Profile Fetcher Starting:', url);
  const response = await debugFetch(url);
  const data = await response.json();
  console.log('📊 Stock Profile Data:', data);
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
      <div className="profile-header">
        <div className="company-info">
          <h1 className="company-name">{data.companyName}</h1>
          <div className="symbol-badge">{data.symbol}</div>
        </div>
        <div className="company-meta">
          <span className="sector">{data.sector}</span>
          <span className="industry">{data.industry}</span>
          <span className="country">{data.country}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card">
          <div className="metric-label">Market Cap</div>
          <div className="metric-value">{formatMarketCap(data.marketCap)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">P/E Ratio</div>
          <div className="metric-value">{data.peRatio?.toFixed(2) || 'N/A'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Dividend Yield</div>
          <div className="metric-value">{data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A'}</div>
        </div>
      </div>

      {/* Company Description */}
      <div className="company-description">
        <h3>About {data.companyName}</h3>
        <p>{data.description}</p>
      </div>

      {/* Company Details */}
      <div className="company-details">
        <div className="detail-row">
          <span className="detail-label">Employees:</span>
          <span className="detail-value">{formatNumber(data.employees)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Founded:</span>
          <span className="detail-value">{data.founded}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Headquarters:</span>
          <span className="detail-value">{data.headquarters}</span>
        </div>
        {data.website && (
          <div className="detail-row">
            <span className="detail-label">Website:</span>
            <a 
              href={data.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="detail-link"
            >
              {data.website.replace('https://', '').replace('http://', '')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}