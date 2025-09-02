import React from 'react'
import { render, screen } from '@/test-utils'
import { ModularMainLayout } from './ModularMainLayout'

describe('ModularMainLayout', () => {
  const mockProps = {
    header: <div data-testid="header">Header Content</div>,
    aiInvestmentOpinion: <div data-testid="ai-opinion">AI Opinion</div>,
    stockProfile: <div data-testid="stock-profile">Stock Profile</div>,
    macroIndicatorsDashboard: <div data-testid="macro-indicators">Macro Indicators</div>,
    aiNewsAnalysisReport: <div data-testid="ai-news">AI News</div>,
    advancedChart: <div data-testid="advanced-chart">Advanced Chart</div>,
    technicalAnalysis: <div data-testid="technical-analysis">Technical Analysis</div>,
    companyProfile: <div data-testid="company-profile">Company Profile</div>,
    fundamentalData: <div data-testid="fundamental-data">Fundamental Data</div>,
    topStories: <div data-testid="top-stories">Top Stories</div>,
  }

  it('should render all sections with proper content', () => {
    render(<ModularMainLayout {...mockProps} />)

    // Check header
    expect(screen.getByTestId('header')).toBeInTheDocument()

    // Check all main sections
    expect(screen.getByTestId('ai-opinion')).toBeInTheDocument()
    expect(screen.getByTestId('stock-profile')).toBeInTheDocument()
    expect(screen.getByTestId('macro-indicators')).toBeInTheDocument()
    expect(screen.getByTestId('ai-news')).toBeInTheDocument()
    expect(screen.getByTestId('advanced-chart')).toBeInTheDocument()
    expect(screen.getByTestId('technical-analysis')).toBeInTheDocument()
    expect(screen.getByTestId('company-profile')).toBeInTheDocument()
    expect(screen.getByTestId('fundamental-data')).toBeInTheDocument()
    expect(screen.getByTestId('top-stories')).toBeInTheDocument()
  })

  it('should render section titles with emojis', () => {
    render(<ModularMainLayout {...mockProps} />)

    expect(screen.getByText('🤖 AI Investment Opinion')).toBeInTheDocument()
    expect(screen.getByText('📊 Stock Profile')).toBeInTheDocument()
    expect(screen.getByText('📊 Macro Indicators')).toBeInTheDocument()
    expect(screen.getByText('📰 AI News Analysis')).toBeInTheDocument()
    expect(screen.getByText('📈 Advanced Chart')).toBeInTheDocument()
    expect(screen.getByText('🔧 Technical Analysis')).toBeInTheDocument()
    expect(screen.getByText('🏢 Company')).toBeInTheDocument()
    expect(screen.getByText('📊 Fundamentals')).toBeInTheDocument()
    expect(screen.getByText('📰 Stories')).toBeInTheDocument()
  })

  it('should have proper layout structure', () => {
    const { container } = render(<ModularMainLayout {...mockProps} />)

    expect(container.querySelector('.main-layout')).toBeInTheDocument()
    expect(container.querySelector('.layout-header')).toBeInTheDocument()
    expect(container.querySelector('.optimized-content-grid')).toBeInTheDocument()
  })
})