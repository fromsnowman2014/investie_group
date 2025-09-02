'use client'

import React from 'react'
import { Grid, GridItem, Section } from './index'

interface ModularMainLayoutProps {
  header: React.ReactNode
  aiInvestmentOpinion: React.ReactNode
  stockProfile: React.ReactNode
  macroIndicatorsDashboard: React.ReactNode
  aiNewsAnalysisReport: React.ReactNode
  advancedChart: React.ReactNode
  technicalAnalysis: React.ReactNode
  companyProfile: React.ReactNode
  fundamentalData: React.ReactNode
  topStories: React.ReactNode
}

export function ModularMainLayout({
  header,
  aiInvestmentOpinion,
  stockProfile,
  macroIndicatorsDashboard,
  aiNewsAnalysisReport,
  advancedChart,
  technicalAnalysis,
  companyProfile,
  fundamentalData,
  topStories,
}: ModularMainLayoutProps) {
  return (
    <div className="main-layout">
      <header className="layout-header">{header}</header>
      
      <Grid>
        {/* Row 1: AI Investment Opinion (Full Width) */}
        <GridItem span={2} className="ai-investment-opinion-section">
          <Section title="AI Investment Opinion" icon="🤖">
            {aiInvestmentOpinion}
          </Section>
        </GridItem>

        {/* Row 2: Stock Profile + Macro Indicators (Half Width Each) */}
        <GridItem span={1} className="stock-profile-section">
          <Section title="Stock Profile" icon="📊">
            {stockProfile}
          </Section>
        </GridItem>

        <GridItem span={1} className="macro-indicators-section">
          <Section title="Macro Indicators" icon="📊">
            {macroIndicatorsDashboard}
          </Section>
        </GridItem>

        {/* Row 3: AI News Analysis (Full Width) */}
        <GridItem span={2} className="ai-news-analysis-section">
          <Section title="AI News Analysis" icon="📰">
            {aiNewsAnalysisReport}
          </Section>
        </GridItem>

        {/* Row 4: Advanced Chart + Technical Analysis (Half Width Each) */}
        <GridItem span={1} className="advanced-chart-section">
          <Section title="Advanced Chart" icon="📈">
            {advancedChart}
          </Section>
        </GridItem>

        <GridItem span={1} className="technical-analysis-section">
          <Section title="Technical Analysis" icon="🔧">
            {technicalAnalysis}
          </Section>
        </GridItem>

        {/* Row 5: Three Sub Widgets (Third Width Each) */}
        <GridItem span={1} className="company-profile-section">
          <Section title="Company" icon="🏢">
            {companyProfile}
          </Section>
        </GridItem>

        <GridItem span={1} className="fundamental-data-section">
          <Section title="Fundamentals" icon="📊">
            {fundamentalData}
          </Section>
        </GridItem>

        <GridItem span={1} className="top-stories-section">
          <Section title="Stories" icon="📰">
            {topStories}
          </Section>
        </GridItem>
      </Grid>
    </div>
  )
}