'use client';

import React from 'react';
import AdvancedChart from '../TradingView/AdvancedChart';
import TechnicalAnalysis from '../TradingView/TechnicalAnalysis';
import CompanyProfile from '../TradingView/CompanyProfile';
import FundamentalData from '../TradingView/FundamentalData';
import TopStories from '../TradingView/TopStories';
import PoweredByTradingView from '../TradingView/PoweredByTradingView';
import { TradingViewErrorBoundary } from '../ErrorBoundary';

interface ChartAnalysisProps {
  symbol: string;
}

export default function ChartAnalysis({ }: ChartAnalysisProps) {
  return (
    <div className="chart-analysis-container">
      {/* Main Chart Section */}
      <div className="main-chart-section">
        <div className="chart-subsection primary-chart">
          <div className="subsection-header">
            <h3>📈 Advanced Chart</h3>
          </div>
          <div className="subsection-content">
            <TradingViewErrorBoundary>
              <AdvancedChart />
            </TradingViewErrorBoundary>
          </div>
        </div>
      </div>

      {/* Secondary Analysis Grid */}
      <div className="secondary-analysis-grid">
        {/* Technical Analysis */}
        <div className="chart-subsection">
          <div className="subsection-header">
            <h3>🔧 Technical Analysis</h3>
          </div>
          <div className="subsection-content">
            <TradingViewErrorBoundary>
              <TechnicalAnalysis />
            </TradingViewErrorBoundary>
          </div>
        </div>

        {/* Company Profile */}
        <div className="chart-subsection">
          <div className="subsection-header">
            <h3>🏢 Company Profile</h3>
          </div>
          <div className="subsection-content">
            <TradingViewErrorBoundary>
              <CompanyProfile />
            </TradingViewErrorBoundary>
          </div>
        </div>

        {/* Fundamental Data */}
        <div className="chart-subsection">
          <div className="subsection-header">
            <h3>📊 Fundamental Data</h3>
          </div>
          <div className="subsection-content">
            <TradingViewErrorBoundary>
              <FundamentalData />
            </TradingViewErrorBoundary>
          </div>
        </div>

        {/* Top Stories */}
        <div className="chart-subsection">
          <div className="subsection-header">
            <h3>📰 Top Stories</h3>
          </div>
          <div className="subsection-content">
            <TradingViewErrorBoundary>
              <TopStories />
            </TradingViewErrorBoundary>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="chart-attribution">
        <PoweredByTradingView />
      </div>
    </div>
  );
}