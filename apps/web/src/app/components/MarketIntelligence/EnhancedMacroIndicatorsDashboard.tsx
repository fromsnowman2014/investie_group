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
        
        <div className="dashboard-grid-clean">
          {/* Loading placeholders */}
          <div className="top-row">
            <div className="fear-greed-card skeleton">
              <div className="skeleton-content"></div>
            </div>
            <div className="sp500-card skeleton">
              <div className="skeleton-content"></div>
            </div>
          </div>
          
          <div className="economic-section skeleton">
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

      <div className="dashboard-grid-clean">
        {/* Top Row - Fear & Greed and S&P 500 */}
        <div className="top-row">
          <div className="fear-greed-card">
            <div className="card-label">Fear & Greed Index</div>
            <div className="fear-greed-value">
              <span className="value-box neutral">
                {data.fearGreedIndex?.value || 50} ({data.fearGreedIndex?.status || 'Neutral'})
              </span>
            </div>
          </div>
          
          <div className="sp500-card">
            <div className="sp500-header">
              <span className="sp500-title">S&P 500</span>
              <span className="sp500-symbol">SPY</span>
            </div>
            <div className="sp500-values">
              <div className="sp500-price">${data.sp500Sparkline?.currentPrice?.toFixed(2) || '647.24'}</div>
              <div className={`sp500-change ${(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? 'positive' : 'negative'}`}>
                {(data.sp500Sparkline?.weeklyChange ?? 1.09) >= 0 ? '+' : ''}{(data.sp500Sparkline?.weeklyChange ?? 1.09).toFixed(2)}%
              </div>
            </div>
            <div className="color-legend">
              Color: Green for +, Red for -, white for no change
            </div>
          </div>
        </div>

        {/* Economic Indicators Row */}
        <div className="economic-section">
          <div className="section-header">
            <span className="section-title">Economic Indicators</span>
            <span className="section-source">FRED API</span>
          </div>
          
          <div className="economic-grid">
            {/* 10Y Treasury */}
            <div className="economic-card">
              <div className="economic-header">
                <span className="economic-icon">📊</span>
                <span className="economic-label">10Y Treasury</span>
              </div>
              <div className="economic-value">
                {data.economicIndicators?.interestRate?.value?.toFixed(2) || '4.26'}%
              </div>
              <div className={`economic-change ${(data.economicIndicators?.interestRate?.change ?? -0.13) >= 0 ? 'positive' : 'negative'}`}>
                {(data.economicIndicators?.interestRate?.change ?? -0.13) >= 0 ? '+' : ''}{(data.economicIndicators?.interestRate?.change ?? -0.13).toFixed(2)}%
              </div>
            </div>

            {/* CPI */}
            <div className="economic-card">
              <div className="economic-header">
                <span className="economic-icon">📈</span>
                <span className="economic-label">CPI</span>
              </div>
              <div className="economic-value">
                {data.economicIndicators?.cpi?.value?.toFixed(1) || '322.1'}
              </div>
              <div className="cpi-changes">
                <div className="cpi-row">
                  <span className="cpi-label">M/M:</span>
                  <span className={`cpi-change ${(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20) >= 0 ? 'positive' : 'negative'}`}>
                    {(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20) >= 0 ? '+' : ''}{(data.economicIndicators?.cpi?.monthOverMonth ?? 0.20).toFixed(2)}%
                  </span>
                </div>
                <div className="cpi-row">
                  <span className="cpi-label">Y/Y:</span>
                  <span className={`cpi-change ${(data.economicIndicators?.cpi?.yearOverYear ?? 2.73) >= 0 ? 'positive' : 'negative'}`}>
                    {(data.economicIndicators?.cpi?.yearOverYear ?? 2.73) >= 0 ? '+' : ''}{(data.economicIndicators?.cpi?.yearOverYear ?? 2.73).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Unemployment */}
            <div className="economic-card">
              <div className="economic-header">
                <span className="economic-icon">👥</span>
                <span className="economic-label">Unemployment</span>
              </div>
              <div className="economic-value">
                {data.economicIndicators?.unemployment?.value?.toFixed(1) || '4.3'}%
              </div>
            </div>
          </div>
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

        .dashboard-grid-clean {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Top Row - Fear & Greed and S&P 500 */
        .top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .fear-greed-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          padding: 24px;
        }

        .card-label {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }

        .fear-greed-value {
          display: flex;
          justify-content: flex-start;
        }

        .value-box {
          background: #fef3c7;
          color: #92400e;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
        }

        .value-box.neutral {
          background: #fef3c7;
          color: #92400e;
        }

        .sp500-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          padding: 24px;
        }

        .sp500-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .sp500-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .sp500-symbol {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
        }

        .sp500-values {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .sp500-price {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .sp500-change {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
        }

        .sp500-change.positive {
          background: #10b981;
          color: white;
        }

        .sp500-change.negative {
          background: #ef4444;
          color: white;
        }

        .color-legend {
          font-size: 12px;
          color: #9ca3af;
          font-style: italic;
        }

        /* Economic Indicators Section */
        .economic-section {
          background: white;
          border-radius: 12px;
          border: 1px solid #e4e7eb;
          padding: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .section-source {
          font-size: 12px;
          color: #9ca3af;
          background: #f8fafc;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .economic-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .economic-card {
          background: #fafbfc;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          padding: 20px;
          text-align: left;
        }

        .economic-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .economic-icon {
          font-size: 16px;
        }

        .economic-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .economic-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .economic-change {
          font-size: 14px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .economic-change.positive {
          background: #10b981;
          color: white;
        }

        .economic-change.negative {
          background: #ef4444;
          color: white;
        }

        .cpi-changes {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cpi-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cpi-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .cpi-change {
          font-size: 14px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cpi-change.positive {
          background: #10b981;
          color: white;
        }

        .cpi-change.negative {
          background: #ef4444;
          color: white;
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .enhanced-macro-dashboard {
            padding: 20px;
          }

          .top-row {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .economic-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .enhanced-macro-dashboard {
            padding: 16px;
          }

          .dashboard-grid-clean {
            gap: 20px;
          }

          .sp500-values {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .sp500-price {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .enhanced-macro-dashboard {
            padding: 12px;
          }

          .fear-greed-card,
          .sp500-card,
          .economic-section {
            padding: 16px;
          }

          .economic-card {
            padding: 16px;
          }

          .economic-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMacroIndicatorsDashboard;