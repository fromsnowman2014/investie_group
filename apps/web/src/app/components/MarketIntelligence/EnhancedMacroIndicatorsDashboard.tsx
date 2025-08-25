'use client';

import React from 'react';
import useSWR from 'swr';
import FearGreedGauge from './EnhancedComponents/FearGreedGauge';
import EconomicIndicatorsGrid from './EnhancedComponents/EconomicIndicatorsGrid';
import SP500SparklineWidget from './EnhancedComponents/SP500SparklineWidget';
import EnhancedSectorGrid from './EnhancedComponents/EnhancedSectorGrid';

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
  
  const { data, error, isLoading } = useSWR<EnhancedMarketSummary>(
    fullApiUrl, // This will be null if API URL is not configured, preventing the request
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Configuration error state
  if (!apiUrl) {
    return (
      <div className="enhanced-macro-dashboard error">
        <div className="dashboard-header">
          <h2>Enhanced Market Intelligence</h2>
          <div className="error-indicator">
            <span className="error-icon">⚠️</span>
            <span>Configuration Error</span>
          </div>
        </div>
        
        <div className="error-message">
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
          <h2>Enhanced Market Intelligence</h2>
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Loading market data...</span>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="grid-section left-column">
            <FearGreedGauge data={null} isLoading={true} />
            <EconomicIndicatorsGrid data={null} isLoading={true} />
          </div>
          
          <div className="grid-section right-column">
            <SP500SparklineWidget data={null} isLoading={true} />
            <EnhancedSectorGrid sectors={null} isLoading={true} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="enhanced-macro-dashboard error">
        <div className="dashboard-header">
          <h2>Enhanced Market Intelligence</h2>
          <div className="error-indicator">
            <span className="error-icon">⚠️</span>
            <span>Unable to load market data. Retrying...</span>
          </div>
        </div>
        
        <div className="error-message">
          <p>We&apos;re experiencing issues connecting to market data services.</p>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="enhanced-macro-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Enhanced Market Intelligence</h2>
          {data.cacheInfo && (
            <div className="cache-performance">
              <span className="cache-hit-rate">
                Cache Hit: {(data.cacheInfo.hitRate * 100).toFixed(1)}%
              </span>
              <span className="avg-response">
                Avg Response: {data.cacheInfo.averageResponseTime}ms
              </span>
            </div>
          )}
        </div>
        <div className="last-updated">
          Last updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="grid-section left-column">
          <FearGreedGauge 
            data={data.fearGreedIndex} 
            isLoading={false}
          />
          <EconomicIndicatorsGrid 
            data={data.economicIndicators} 
            isLoading={false}
          />
        </div>
        
        <div className="grid-section right-column">
          <SP500SparklineWidget 
            data={data.sp500Sparkline} 
            isLoading={false}
          />
          <EnhancedSectorGrid 
            sectors={data.sectorPerformance} 
            isLoading={false}
          />
        </div>
      </div>

      <style jsx>{`
        .enhanced-macro-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .enhanced-macro-dashboard.loading {
          opacity: 0.8;
        }

        .enhanced-macro-dashboard.error {
          opacity: 0.9;
        }

        .dashboard-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e2e8f0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .dashboard-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          background: linear-gradient(135deg, #00bce5 0%, #2962ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cache-performance {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .cache-hit-rate,
        .avg-response {
          font-size: 11px;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .last-updated {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .grid-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .left-column {
          /* Fear & Greed Index and Economic Indicators */
        }

        .right-column {
          /* S&P 500 Sparkline and Sector Performance */
        }

        /* Mobile responsiveness */
        @media (max-width: 1024px) {
          .enhanced-macro-dashboard {
            padding: 16px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .cache-performance {
            align-self: flex-end;
          }

          .dashboard-header h2 {
            font-size: 20px;
          }
        }

        @media (max-width: 768px) {
          .enhanced-macro-dashboard {
            padding: 12px;
          }

          .dashboard-grid {
            gap: 16px;
          }

          .grid-section {
            gap: 16px;
          }

          .cache-performance {
            flex-direction: column;
            gap: 4px;
            align-self: stretch;
          }

          .dashboard-header h2 {
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .enhanced-macro-dashboard {
            padding: 8px;
          }

          .dashboard-header {
            margin-bottom: 16px;
          }

          .header-content {
            align-items: stretch;
          }

          .cache-performance {
            align-self: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMacroIndicatorsDashboard;