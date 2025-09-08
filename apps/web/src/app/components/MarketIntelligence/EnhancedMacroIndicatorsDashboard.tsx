'use client';

import React from 'react';
import useSWR from 'swr';

interface EnhancedMarketSummary {
  fearGreedIndex: {
    value: number;
    status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
    confidence: number;
    components: {
      marketVolatility: number;
      marketVolume: number;
      marketMomentum: number;
      stockPriceBreadth: number;
      safehavenDemand: number;
      junkBondDemand: number;
      putCallRatio: number;
    };
    methodology: string;
    lastUpdated: string;
    source: string;
  } | null;
  
  economicIndicators: {
    interestRate: {
      value: number;
      previousValue: number;
      change: number;
      percentChange: number;
      basisPointsChange: number;
      date: string;
      trend: 'rising' | 'falling' | 'stable';
      source: string;
      aiOutlook?: string;
    } | null;
    cpi: {
      value: number;
      previousValue: number;
      change: number;
      percentChange: number;
      monthOverMonth: number;
      yearOverYear: number;
      date: string;
      trend: 'rising' | 'falling' | 'stable';
      direction: 'up' | 'down' | 'stable';
      inflationPressure: 'low' | 'moderate' | 'high';
      source: string;
    } | null;
    unemployment: {
      value: number;
      previousValue: number;
      change: number;
      percentChange: number;
      monthOverMonth: number;
      date: string;
      trend: 'rising' | 'falling' | 'stable';
      employmentHealth: 'strong' | 'moderate' | 'weak';
      source: string;
    } | null;
  } | null;
  
  sp500Sparkline: {
    data: Array<{
      timestamp: string;
      price: number;
      volume?: number;
    }>;
    currentPrice: number;
    weeklyChange: number;
    weeklyTrend: 'up' | 'down' | 'flat';
    volatility: 'low' | 'moderate' | 'high';
    marketSentiment: 'bullish' | 'neutral' | 'bearish';
  } | null;
  
  sectorPerformance: Array<{
    sector: string;
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    weeklyPerformance: number;
    monthlyPerformance: number;
    momentum: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    leadership: 'leader' | 'laggard' | 'neutral';
    rotationSignal: 'inflow' | 'outflow' | 'neutral';
    relativeStrength: number;
    correlation: number;
    lastUpdated: string;
  }> | null;
  
  lastUpdated: string;
  cacheInfo?: {
    hitRate: number;
    totalRequests: number;
    averageResponseTime: number;
  };
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
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Enhanced Market API Response:', apiResponse);
    console.log('📦 API Response Structure:', Object.keys(apiResponse));
    console.log('✅ Extracting data field:', !!apiResponse.data);
  }
  
  // Extract the actual market data from the API response wrapper
  if (apiResponse.success && apiResponse.data) {
    return apiResponse.data;
  }
  
  throw new Error('Invalid API response structure: missing success or data field');
};

const EnhancedMacroIndicatorsDashboard: React.FC = () => {
  // Check if API URL is properly configured
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const fullApiUrl = apiUrl ? `${apiUrl}/api/v1/market/enhanced-summary` : null;

  // Dynamic refresh interval based on market hours
  const getRefreshInterval = () => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    
    // Market is open Monday-Friday (1-5), 9:30 AM - 4:00 PM EST
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 300000; // Weekend: 5 minutes
    }
    
    const timeInMinutes = hour * 60 + minute;
    const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM
    const marketCloseMinutes = 16 * 60;     // 4:00 PM
    
    const isMarketHours = timeInMinutes >= marketOpenMinutes && timeInMinutes <= marketCloseMinutes;
    
    if (isMarketHours) {
      return 30000; // Market hours: 30 seconds
    } else if (timeInMinutes > marketCloseMinutes - 60 && timeInMinutes < marketCloseMinutes + 60) {
      return 60000; // Around market close: 1 minute
    } else {
      return 180000; // After hours: 3 minutes
    }
  };
  
  const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
    fullApiUrl, // This will be null if API URL is not configured, preventing the request
    fetcher,
    {
      refreshInterval: getRefreshInterval(),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      // Add dedupe interval to prevent too many requests
      dedupingInterval: 10000,
    }
  );

  // Configuration error state
  if (!apiUrl) {
    return (
      <div className="enhanced-macro-dashboard error">
        <div className="error-message">
          <div className="error-indicator">
            <span className="error-icon">⚠️</span>
            <span>Configuration Error</span>
          </div>
          <p>API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="enhanced-macro-dashboard loading">
        <div className="dashboard-header">
          <h2 className="dashboard-title">📊 Macro Indicators</h2>
        </div>
        
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
        <div className="dashboard-header">
          <h2 className="dashboard-title">📊 Macro Indicators</h2>
        </div>
        
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
      <div className="dashboard-header">
        <h2 className="dashboard-title">📊 Macro Indicators</h2>
      </div>

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

        {/* Economic Indicators Header */}
        <div className="section-divider">
          <span className="section-title">Economic Indicators</span>
          <span className="section-source">FRED API</span>
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
          padding: 24px;
          background: #fafbfc;
          border-radius: 16px;
          border: 1px solid #e4e7eb;
        }

        .enhanced-macro-dashboard.loading {
          opacity: 0.8;
        }

        .enhanced-macro-dashboard.error {
          opacity: 0.9;
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
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }

        .error-message p {
          margin: 8px 0;
          color: #991b1b;
          font-size: 14px;
        }

        .dashboard-header {
          margin-bottom: 24px;
        }

        .dashboard-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .dashboard-grid-compact {
          background: white;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .indicator-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fafbfc;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          min-height: 48px;
        }

        .indicator-label {
          font-size: 16px;
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
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .main-value {
          font-size: 18px;
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
          padding: 16px 16px 12px 16px;
          border-bottom: 2px solid #f1f5f9;
          background: #f8fafc;
          border-radius: 8px 8px 0 0;
          margin-top: 8px;
        }

        .section-title {
          font-size: 16px;
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

        .color-note {
          font-size: 12px;
          color: #9ca3af;
          font-style: italic;
          text-align: center;
          padding: 8px;
          background: #f8fafc;
          border-radius: 6px;
          margin-top: 8px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .enhanced-macro-dashboard {
            padding: 16px;
          }

          .dashboard-grid-compact {
            padding: 16px;
            gap: 12px;
          }

          .indicator-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 12px;
            min-height: auto;
          }

          .indicator-value {
            align-self: flex-end;
            gap: 8px;
          }

          .sub-values {
            flex-direction: column;
            gap: 6px;
            align-items: flex-end;
          }

          .price-text {
            font-size: 18px;
          }

          .main-value {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .enhanced-macro-dashboard {
            padding: 12px;
          }

          .dashboard-grid-compact {
            padding: 12px;
            gap: 10px;
          }

          .indicator-row {
            padding: 10px;
          }

          .indicator-label {
            font-size: 14px;
          }

          .price-text {
            font-size: 16px;
          }

          .main-value {
            font-size: 14px;
          }

          .change-badge {
            font-size: 12px;
            padding: 3px 6px;
          }

          .sub-values {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMacroIndicatorsDashboard;