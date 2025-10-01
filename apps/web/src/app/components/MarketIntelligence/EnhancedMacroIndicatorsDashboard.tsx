'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchMarketOverview } from '@/lib/api-utils';

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

  // API Error Information
  apiError?: {
    isError: boolean;
    isRateLimit: boolean;
    message: string;
    details: string;
    suggestedAction: string;
  };

  // Legacy API Rate Limit Information (for backward compatibility)
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
    availableTomorrow?: boolean;
  };
}


const fetcher = async (): Promise<EnhancedMarketSummary> => {
  const apiResponse = await fetchMarketOverview();
  
  console.log('🔍 Raw API Response:', apiResponse);
  
  // The API returns data directly, not wrapped in success/data structure
  const responseObj = apiResponse as unknown as Record<string, unknown>;
  
  // Check if this is wrapped response (legacy format)
  if (responseObj.success && responseObj.data) {
    console.log('✅ Using wrapped response format');
    return responseObj.data as EnhancedMarketSummary;
  }
  
  // Check if this is direct response format (current production format)
  if (responseObj.economicIndicators || responseObj.indices || responseObj.fearGreedIndex) {
    console.log('✅ Using direct response format');
    
    // Transform the API response to match our expected interface
    const transformedData: EnhancedMarketSummary = {
      fearGreedIndex: responseObj.fearGreedIndex ? {
        value: Number((responseObj.fearGreedIndex as Record<string, unknown>).value) || 50,
        status: ((responseObj.fearGreedIndex as Record<string, unknown>).status as 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed') || 'neutral'
      } : null,
      
      economicIndicators: responseObj.economicIndicators ? {
        interestRate: (responseObj.economicIndicators as Record<string, unknown>).interestRate ? {
          value: Number(((responseObj.economicIndicators as Record<string, unknown>).interestRate as Record<string, unknown>).value) || 0,
          change: Number(((responseObj.economicIndicators as Record<string, unknown>).interestRate as Record<string, unknown>).change) || 0
        } : null,
        cpi: (responseObj.economicIndicators as Record<string, unknown>).cpi ? {
          value: Number(((responseObj.economicIndicators as Record<string, unknown>).cpi as Record<string, unknown>).value) || 0,
          monthOverMonth: Number(((responseObj.economicIndicators as Record<string, unknown>).cpi as Record<string, unknown>).percentChange) || 0,
          yearOverYear: Number(((responseObj.economicIndicators as Record<string, unknown>).cpi as Record<string, unknown>).percentChange) || 0
        } : null,
        unemployment: (responseObj.economicIndicators as Record<string, unknown>).unemployment ? {
          value: Number(((responseObj.economicIndicators as Record<string, unknown>).unemployment as Record<string, unknown>).value) || 0
        } : null
      } : null,
      
      sp500Sparkline: (responseObj.indices as Record<string, unknown>)?.sp500 ? {
        currentPrice: Number(((responseObj.indices as Record<string, unknown>).sp500 as Record<string, unknown>).value) || 0,
        weeklyChange: Number(((responseObj.indices as Record<string, unknown>).sp500 as Record<string, unknown>).changePercent) || 0
      } : null,
      
      lastUpdated: (responseObj.lastUpdated as string) || new Date().toISOString(),

      // Handle new API error structure
      apiError: responseObj.apiError as {
        isError: boolean;
        isRateLimit: boolean;
        message: string;
        details: string;
        suggestedAction: string;
      } | undefined,

      // Legacy support
      alphaVantageRateLimit: responseObj.alphaVantageRateLimit as {
        isLimited: boolean;
        message?: string;
        resetTime?: string;
        availableTomorrow?: boolean;
      } | undefined
    };
    
    console.log('🔄 Transformed Data:', transformedData);
    return transformedData;
  }
  
  console.error('❌ Unexpected API response structure:', responseObj);
  throw new Error('Invalid API response structure: missing expected fields');
};

const EnhancedMacroIndicatorsDashboard: React.FC = () => {

  const { data, error, isLoading, mutate } = useSWR<EnhancedMarketSummary>(
    'market-overview',
    fetcher,
    {
      // Disable automatic refresh to prevent API overload
      refreshInterval: 0, // No automatic refresh
      revalidateOnFocus: false, // Don't refresh when tab gains focus
      revalidateOnReconnect: false, // Don't refresh on network reconnect
      errorRetryCount: 1, // Reduce retry attempts
      errorRetryInterval: 5000, // Increase retry interval
      dedupingInterval: 30000, // Cache for 30 seconds to prevent duplicate requests
      revalidateIfStale: false, // Don't auto-refresh stale data
      revalidateOnMount: true, // Only fetch on initial mount
    }
  );

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered by user');
    try {
      await mutate(); // This will trigger a fresh fetch
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    }
  };

  // Note: API URL configuration error handling removed as we now auto-detect the URL

  // Debug logging
  console.group('🔍 Enhanced Macro Indicators Debug');
  console.log('Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  });
  console.log('SWR State:', { isLoading, error: error?.message, hasData: !!data });
  console.groupEnd();

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
      {/* Dashboard Header with Manual Refresh */}
      <div className="dashboard-header">
        <h3 className="dashboard-title">📊 Macro Market Indicators</h3>
        <button
          className="refresh-button"
          onClick={handleManualRefresh}
          disabled={isLoading}
          title="Refresh market data"
        >
          <span className="refresh-icon">🔄</span>
          <span className="refresh-text">Refresh</span>
        </button>
      </div>

      {/* API Error Warning */}
      {data.apiError?.isError && (
        <div className={`api-error-warning ${data.apiError.isRateLimit ? 'rate-limit' : 'general-error'}`}>
          <div className="warning-header">
            <span className="warning-icon">{data.apiError.isRateLimit ? '⏰' : '⚠️'}</span>
            <span className="warning-title">
              {data.apiError.isRateLimit ? 'API Rate Limit Reached' : 'API Connection Issue'}
            </span>
          </div>
          <div className="warning-content">
            <p className="warning-message">{data.apiError.message}</p>
            <p className="warning-action">
              <strong>Next Steps:</strong> {data.apiError.suggestedAction}
            </p>
            <details className="warning-details">
              <summary>Technical Details</summary>
              <p className="warning-technical">{data.apiError.details}</p>
            </details>
          </div>
        </div>
      )}

      {/* Legacy API Rate Limit Warning (for backward compatibility) */}
      {!data.apiError?.isError && data.alphaVantageRateLimit?.isLimited && (
        <div className="rate-limit-warning">
          <div className="warning-header">
            <span className="warning-icon">ℹ️</span>
            <span className="warning-title">Stock Data Temporarily Limited</span>
          </div>
          <div className="warning-content">
            <p>Daily stock market data query limit has been reached.</p>
            <p className="warning-detail">
              📊 <strong>Still Available:</strong> Interest rates, inflation, unemployment and other economic indicators
            </p>
            <p className="warning-reset">
              🕒 <strong>Stock Data Reset:</strong> {data.alphaVantageRateLimit.resetTime || 'Tomorrow morning'}
            </p>
            {data.alphaVantageRateLimit.availableTomorrow && (
              <p className="warning-retry">Visit again tomorrow to access real-time stock market data.</p>
            )}
          </div>
        </div>
      )}
      
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
        <div className={`indicator-row ${data.apiError?.isError || data.alphaVantageRateLimit?.isLimited ? 'api-error' : ''}`}>
          <span className="indicator-label">
            S&P 500 Index
            {(data.apiError?.isError || data.alphaVantageRateLimit?.isLimited) && (
              <span className="error-badge">
                {data.apiError?.isRateLimit ? 'Rate Limited' : data.apiError?.isError ? 'API Error' : 'Limited'}
              </span>
            )}
          </span>
          <span className="indicator-value">
            {(data.apiError?.isError || data.alphaVantageRateLimit?.isLimited) ? (
              <span className="unavailable-text">
                {data.apiError?.isRateLimit ? 'Rate Limit Exceeded' :
                 data.apiError?.isError ? 'API Unavailable' : 'Temporarily Unavailable'}
              </span>
            ) : data.sp500Sparkline ? (
              <>
                <span className="price-text">{data.sp500Sparkline.currentPrice.toFixed(2)}</span>
                <span className={`change-badge ${data.sp500Sparkline.weeklyChange >= 0 ? 'positive' : 'negative'}`}>
                  {data.sp500Sparkline.weeklyChange >= 0 ? '+' : ''}{data.sp500Sparkline.weeklyChange.toFixed(2)}%
                </span>
              </>
            ) : (
              <span className="unavailable-text">No Data Available</span>
            )}
          </span>
        </div>

        {/* 10Y Treasury */}
        <div className="indicator-row">
          <span className="indicator-label">📊 10Y Treasury</span>
          <span className="indicator-value">
            {data.economicIndicators?.interestRate ? (
              <>
                <span className="main-value">{data.economicIndicators.interestRate.value.toFixed(2)}%</span>
                <span className={`change-badge ${data.economicIndicators.interestRate.change >= 0 ? 'positive' : 'negative'}`}>
                  {data.economicIndicators.interestRate.change >= 0 ? '+' : ''}{data.economicIndicators.interestRate.change.toFixed(2)}%
                </span>
              </>
            ) : (
              <span className="unavailable-text">No Data Available</span>
            )}
          </span>
        </div>

        {/* CPI */}
        <div className="indicator-row">
          <span className="indicator-label">📈 CPI</span>
          <span className="indicator-value">
            {data.economicIndicators?.cpi ? (
              <>
                <span className="main-value">{data.economicIndicators.cpi.value.toFixed(1)}</span>
                <span className="sub-values">
                  M/M: <span className={`change-mini ${data.economicIndicators.cpi.monthOverMonth >= 0 ? 'positive' : 'negative'}`}>
                    {data.economicIndicators.cpi.monthOverMonth >= 0 ? '+' : ''}{data.economicIndicators.cpi.monthOverMonth.toFixed(2)}%
                  </span>
                  Y/Y: <span className={`change-mini ${data.economicIndicators.cpi.yearOverYear >= 0 ? 'positive' : 'negative'}`}>
                    {data.economicIndicators.cpi.yearOverYear >= 0 ? '+' : ''}{data.economicIndicators.cpi.yearOverYear.toFixed(2)}%
                  </span>
                </span>
              </>
            ) : (
              <span className="unavailable-text">No Data Available</span>
            )}
          </span>
        </div>

        {/* Unemployment */}
        <div className="indicator-row">
          <span className="indicator-label">👥 Unemployment</span>
          <span className="indicator-value">
            {data.economicIndicators?.unemployment ? (
              <span className="main-value">{data.economicIndicators.unemployment.value.toFixed(1)}%</span>
            ) : (
              <span className="unavailable-text">No Data Available</span>
            )}
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

        /* Dashboard Header Styles */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .dashboard-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #00bce5 0%, #2962ff 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 188, 229, 0.2);
        }

        .refresh-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 188, 229, 0.3);
        }

        .refresh-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 4px rgba(0, 188, 229, 0.1);
        }

        .refresh-icon {
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .refresh-button:hover:not(:disabled) .refresh-icon {
          transform: rotate(180deg);
        }

        .refresh-text {
          font-size: 13px;
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

        /* API Error Warning Styles */
        .api-error-warning {
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .api-error-warning.rate-limit {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border: 1px solid #f59e0b;
        }

        .api-error-warning.general-error {
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
          border: 1px solid #ef4444;
        }

        .api-error-warning .warning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .api-error-warning .warning-icon {
          font-size: 18px;
        }

        .api-error-warning .warning-title {
          font-weight: 600;
          font-size: 16px;
        }

        .api-error-warning.rate-limit .warning-title {
          color: #92400e;
        }

        .api-error-warning.general-error .warning-title {
          color: #991b1b;
        }

        .api-error-warning .warning-content p {
          margin: 8px 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .api-error-warning.rate-limit .warning-content p {
          color: #78350f;
        }

        .api-error-warning.general-error .warning-content p {
          color: #7f1d1d;
        }

        .api-error-warning .warning-message {
          font-weight: 500;
          font-size: 15px;
        }

        .api-error-warning .warning-action {
          background: rgba(0, 0, 0, 0.05);
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 3px solid;
        }

        .api-error-warning.rate-limit .warning-action {
          border-left-color: #f59e0b;
        }

        .api-error-warning.general-error .warning-action {
          border-left-color: #ef4444;
        }

        .api-error-warning .warning-details {
          margin-top: 12px;
        }

        .api-error-warning .warning-details summary {
          cursor: pointer;
          font-weight: 500;
          opacity: 0.8;
        }

        .api-error-warning .warning-technical {
          margin-top: 8px;
          font-family: monospace;
          font-size: 12px;
          opacity: 0.7;
          background: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 4px;
        }

        /* Error Badge Styles */
        .error-badge {
          background: #fecaca;
          color: #991b1b;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 500;
          margin-left: 8px;
        }

        .indicator-row.api-error {
          opacity: 0.6;
          position: relative;
        }

        /* Rate Limit Warning Styles (Legacy) */
        .rate-limit-warning {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
        }
        
        .warning-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .warning-icon {
          font-size: 18px;
        }
        
        .warning-title {
          font-weight: 600;
          font-size: 16px;
          color: #92400e;
        }
        
        .warning-content p {
          margin: 8px 0;
          font-size: 14px;
          color: #78350f;
          line-height: 1.5;
        }
        
        .warning-content p:first-child {
          margin-top: 0;
          font-size: 15px;
          font-weight: 500;
        }
        
        .warning-content p:last-child {
          margin-bottom: 0;
        }
        
        .warning-detail {
          background: rgba(245, 158, 11, 0.1);
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 3px solid #f59e0b;
        }
        
        .warning-reset {
          font-weight: 500;
        }
        
        .warning-retry {
          font-style: italic;
          opacity: 0.9;
        }
        
        /* Rate Limited Indicator Styles */
        .indicator-row.rate-limited {
          opacity: 0.6;
          position: relative;
        }
        
        .limited-badge {
          background: #fecaca;
          color: #991b1b;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 500;
          margin-left: 8px;
        }
        
        .unavailable-text {
          color: #94a3b8;
          font-style: italic;
          font-size: 13px;
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

          .dashboard-header {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }

          .dashboard-title {
            font-size: 16px;
          }

          .refresh-button {
            padding: 6px 12px;
            font-size: 12px;
          }

          .refresh-text {
            font-size: 11px;
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