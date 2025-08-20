'use client';

import React from 'react';

interface MainLayoutProps {
  header: React.ReactNode;
  aiAnalysis: React.ReactNode;
  marketIntelligence: React.ReactNode;
  chartAnalysis: React.ReactNode;
}

export default function MainLayout({ 
  header, 
  aiAnalysis, 
  marketIntelligence, 
  chartAnalysis 
}: MainLayoutProps) {
  return (
    <div className="main-layout">
      {/* Header Section - Fixed at top */}
      <header className="layout-header">
        {header}
      </header>

      {/* Main Content Grid - 4 sections */}
      <div className="content-grid">
        {/* AI Analysis Section - Left top */}
        <section className="ai-analysis-section">
          <div className="section-header">
            <h2>AI Analysis</h2>
          </div>
          <div className="section-content">
            {aiAnalysis}
          </div>
        </section>

        {/* Market Intelligence Section - Right top */}
        <section className="market-intelligence-section">
          <div className="section-header">
            <h2>Market Intelligence</h2>
          </div>
          <div className="section-content">
            {marketIntelligence}
          </div>
        </section>

        {/* Chart Analysis Section - Bottom spanning full width */}
        <section className="chart-analysis-section">
          <div className="section-header">
            <h2>Chart Analysis</h2>
          </div>
          <div className="section-content">
            {chartAnalysis}
          </div>
        </section>
      </div>
    </div>
  );
}