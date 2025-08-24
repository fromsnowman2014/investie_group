'use client';

import React from 'react';

interface MainLayoutProps {
  header: React.ReactNode;
  aiInvestmentOpinion: React.ReactNode;
  stockProfile: React.ReactNode;
  macroIndicatorsDashboard: React.ReactNode;
  aiNewsAnalysisReport: React.ReactNode;
  advancedChart: React.ReactNode;
  technicalAnalysis: React.ReactNode;
  companyProfile: React.ReactNode;
  fundamentalData: React.ReactNode;
}

export default function MainLayout({
  header, 
  aiInvestmentOpinion,
  stockProfile,
  macroIndicatorsDashboard, 
  aiNewsAnalysisReport,
  advancedChart,
  technicalAnalysis,
  companyProfile,
  fundamentalData
}: MainLayoutProps) {
  return (
    <div className="main-layout">
      <header className="layout-header">{header}</header>
      
      <div className="optimized-content-grid">
        {/* Row 1: AI Investment Opinion (Full Width) */}
        <section className="ai-investment-opinion-section">
          <div className="section-header">
            <h2>🤖 AI Investment Opinion</h2>
          </div>
          <div className="section-content">
            {aiInvestmentOpinion}
          </div>
        </section>

        {/* Row 2: Stock Profile + Macro Indicators (Half Width Each) */}
        <section className="stock-profile-section">
          <div className="section-header">
            <h2>📊 Stock Profile</h2>
          </div>
          <div className="section-content">
            {stockProfile}
          </div>
        </section>

        <section className="macro-indicators-section">
          <div className="section-header">
            <h2>📊 Macro Indicators</h2>
          </div>
          <div className="section-content">
            {macroIndicatorsDashboard}
          </div>
        </section>

        {/* Row 3: AI News Analysis (Full Width) */}
        <section className="ai-news-analysis-section">
          <div className="section-header">
            <h2>📰 AI News Analysis</h2>
          </div>
          <div className="section-content">
            {aiNewsAnalysisReport}
          </div>
        </section>

        {/* Row 4: Advanced Chart + Technical Analysis (Half Width Each) */}
        <section className="advanced-chart-section">
          <div className="section-header">
            <h2>📈 Advanced Chart</h2>
          </div>
          <div className="section-content">
            {advancedChart}
          </div>
        </section>

        <section className="technical-analysis-section">
          <div className="section-header">
            <h2>🔧 Technical Analysis</h2>
          </div>
          <div className="section-content">
            {technicalAnalysis}
          </div>
        </section>

        {/* Row 5: Two Sub Widgets (Half Width Each) */}
        <section className="company-profile-section">
          <div className="section-header">
            <h2>🏢 Company</h2>
          </div>
          <div className="section-content">
            {companyProfile}
          </div>
        </section>

        <section className="fundamental-data-section">
          <div className="section-header">
            <h2>📊 Fundamentals</h2>
          </div>
          <div className="section-content">
            {fundamentalData}
          </div>
        </section>
      </div>
    </div>
  );
}