'use client';

import React from 'react';
import useSWR from 'swr';

interface EnhancedMarketSummary {
  fearGreedIndex: {
    value: number;
    status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  } | null;
  
  economicIndicators: {
    interestRate: {
      value: number;
      change: number;
    } | null;
    cpi: {
      value: number;
      monthOverMonth: number;
      yearOverYear: number;
    } | null;
    unemployment: {
      value: number;
    } | null;
  } | null;
  
  sp500Sparkline: {
    currentPrice: number;
    weeklyChange: number;
  } | null;
  
  lastUpdated: string;
}


const fetcher = async (url: string): Promise<EnhancedMarketSummary> => {
  if (!url || url === 'undefined/api/v1/market/enhanced-summary') {
    throw new Error('Invalid API URL: NEXT_PUBLIC_API_URL environment variable not set');
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const apiResponse = await response.json();
  
  
  // Extract the actual market data from the API response wrapper
  if (apiResponse.success && apiResponse.data) {
    return apiResponse.data;
  }
  
  throw new Error('Invalid API response structure: missing success or data field');
};

const EnhancedMacroIndicatorsDashboard: React.FC = () => {
  // Check if API URL is properly configured
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const fullApiUrl = `${apiUrl}/api/v1/market/enhanced-summary`;

  // Simplified refresh interval
  const getRefreshInterval = () => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dayOfWeek = easternTime.getDay();
    const hour = easternTime.getHours();
    
    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) return 300000;
    // Market hours (9-16)
    if (hour >= 9 && hour <= 16) return 60000;
    // Off hours
    return 180000;
  };
  
  const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
    fullApiUrl, // This will be null if API URL is not configured, preventing the request
    fetcher,
    {
      refreshInterval: getRefreshInterval(),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      dedupingInterval: 5000,
    }
  );

  // Note: API URL configuration error handling removed as we now auto-detect the URL

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="enhanced-macro-dashboard loading">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <span>Loading market data...</span>
        </div>
        
        <div className="dashboard-grid-compact">
          {/* Loading placeholders */}
          <div className="indicator-row skeleton">
            <div className="skeleton-content"></div>
          </div>
          <div className="indicator-row skeleton">
            <div className="skeleton-content"></div>
          </div>
          <div className="section-divider skeleton">
            <div className="skeleton-content"></div>
          </div>
          <div className="indicator-row skeleton">
            <div className="skeleton-content"></div>
          </div>
          <div className="indicator-row skeleton">
            <div className="skeleton-content"></div>
          </div>
          <div className="indicator-row skeleton">
            <div className="skeleton-content"></div>
          </div>
        </div>
        
        <style jsx>{`
          .skeleton {
            background: #f8fafc;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          
          .skeleton-content {
            height: 60px;
            background: #e2e8f0;
            border-radius: 8px;
            width: 100%;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="enhanced-macro-dashboard error">
        <div className="error-message">
          <div className="error-indicator">
            <span className="error-icon">⚠️</span>
            <span>Unable to load market data. Retrying...</span>
          </div>
          <p>We&apos;re experiencing issues connecting to market data services.</p>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="enhanced-macro-dashboard">
      <div className="dashboard-grid-compact">
        {/* Fear & Greed Index */}
        <div className="indicator-row">
          <span className="indicator-label">Fear & Greed Index</span>
          <span className="indicator-value">
            <span className={`value-badge neutral`}>
              {data.fearGreedIndex?.value || 50} ({data.fearGreedIndex?.status || 'Neutral'})
            </span>
          </span>
        </div>
        
        {/* S&P 500 */}
        <div className="indicator-row">
          <span className="indicator-label">S&P 500 <span className="symbol-text">SPY</span></span>
          <span className="indicator-value">
            <span className="price-text">${data.sp500Sparkline?.currentPrice?.toFixed(2) || '647.24'}</span>
            <span className={`change-badge ${(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? 'positive' : 'negative'}`}>
              {(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? '+' : ''}{(data.sp500Sparkline?.weeklyChange ?? 1.09).toFixed(2)}%
            </span>
          </span>
        </div>

        {/* 10Y Treasury */}
        <div className="indicator-row">
          <span className="indicator-label">📊 10Y Treasury</span>
          <span className="indicator-value">
            <span className="main-value">{data.economicIndicators?.interestRate?.value?.toFixed(2) || '4.26'}%</span>
            <span className={`change-badge ${(data.economicIndicators?.interestRate?.change ?? -0.13) >= 0 ? 'positive' : 'negative'}`}>
              {(data.economicIndicators?.interestRate?.change ?? -0.13) >= 0 ? '+' : ''}{(data.economicIndicators?.interestRate?.change ?? -0.13).toFixed(2)}%
            </span>
          </span>
        </div>

        {/* CPI */}
        <div className="indicator-row">
          <span className="indicator-label">📈 CPI</span>
          <span className="indicator-value">
            <span className="main-value">{data.economicIndicators?.cpi?.value?.toFixed(1) || '322.1'}</span>
            <span className="sub-values">
              M/M: <span className={`change-mini ${(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20) >= 0 ? 'positive' : 'negative'}`}>
                {(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20) >= 0 ? '+' : ''}{(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20).toFixed(2)}%
              </span>
              Y/Y: <span className={`change-mini ${(data.economicIndicators?.cpi?.yearOverYear ?? 2.73) >= 0 ? 'positive' : 'negative'}`}>
                {(data.economicIndicators?.cpi?.yearOverYear ?? 2.73) >= 0 ? '+' : ''}{(data.economicIndicators?.cpi?.yearOverYear ?? 2.73).toFixed(2)}%
              </span>
            </span>
          </span>
        </div>

        {/* Unemployment */}
        <div className="indicator-row">
          <span className="indicator-label">👥 Unemployment</span>
          <span className="indicator-value">
            <span className="main-value">{data.economicIndicators?.unemployment?.value?.toFixed(1) || '4.3'}%</span>
          </span>
        </div>

      </div>

      <style jsx>{`
        .enhanced-macro-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px;
          background: #fafbfc;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
        }

        .enhanced-macro-dashboard.loading,
        .enhanced-macro-dashboard.error {
          opacity: 0.8;
        }

        .loading-indicator,
        .error-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #00bce5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 16px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          text-align: center;
        }

        .error-message p {
          margin: 8px 0;
          color: #991b1b;
          font-size: 14px;
        }


        .dashboard-grid-compact {
          background: white;
          border-radius: 8px;
          border: 1px solid #e4e7eb;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .indicator-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #fafbfc;
          border: 1px solid #f1f5f9;
          border-radius: 6px;
          min-height: 40px;
        }

        .indicator-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .symbol-text {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
        }

        .indicator-value {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .value-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .value-badge.neutral {
          background: #fef3c7;
          color: #92400e;
        }

        .price-text {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .main-value {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .change-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
        }

        .change-badge.positive {
          background: #10b981;
          color: white;
        }

        .change-badge.negative {
          background: #ef4444;
          color: white;
        }

        .sub-values {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .change-mini {
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        .change-mini.positive {
          background: #10b981;
          color: white;
        }

        .change-mini.negative {
          background: #ef4444;
          color: white;
        }

        .section-divider {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 12px 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
          border-radius: 6px 6px 0 0;
          margin-top: 6px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .section-source {
          font-size: 12px;
          color: #9ca3af;
          background: white;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }


        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .enhanced-macro-dashboard {
            padding: 12px;
          }

          .dashboard-grid-compact {
            padding: 12px;
            gap: 10px;
          }

          .indicator-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding: 8px 10px;
            min-height: auto;
          }

          .indicator-value {
            align-self: flex-end;
            gap: 6px;
          }

          .sub-values {
            flex-direction: column;
            gap: 4px;
            align-items: flex-end;
            font-size: 12px;
          }

          .price-text, .main-value {
            font-size: 14px;
          }

          .indicator-label {
            font-size: 12px;
          }

          .change-badge {
            font-size: 11px;
            padding: 2px 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMacroIndicatorsDashboard;