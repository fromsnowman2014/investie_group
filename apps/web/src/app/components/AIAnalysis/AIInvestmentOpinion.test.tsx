import React from 'react'
import { render, screen } from '@/test-utils'
import AIInvestmentOpinion from './AIInvestmentOpinion'

// Mock the API utility
jest.mock('../../../lib/api-utils', () => ({
  debugFetch: jest.fn()
}))

// Mock SWR
jest.mock('swr', () => jest.fn())

// Mock FinancialExpandableSection
jest.mock('../FinancialExpandableSection', () => {
  return function MockFinancialExpandableSection({ 
    title, 
    children 
  }: { 
    title: string
    children: React.ReactNode 
  }) {
    return (
      <div data-testid="financial-expandable-section">
        <h3>{title}</h3>
        {children}
      </div>
    )
  }
})

const mockAIAnalysisData = {
  symbol: 'AAPL',
  recommendation: 'BUY' as const,
  confidence: 0.85,
  targetPrice: 200.00,
  currentPrice: 180.00,
  priceChange: 2.50,
  priceChangePercent: 1.41,
  analysisDate: '2024-01-15T10:30:00Z',
  keyPoints: [
    'Strong quarterly earnings growth',
    'Expanding service revenue streams',
    'Innovation in AI and AR technologies'
  ],
  risks: [
    'Supply chain constraints in global markets',
    'Increased regulatory scrutiny'
  ],
  opportunities: [
    'Growing adoption of 5G technology',
    'Expansion in emerging markets'
  ],
  timeHorizon: 'Medium-term',
  investmentRating: 8
}

describe('AIInvestmentOpinion Component', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockUseSWR = require('swr')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true
    })

    const { container } = render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(container.querySelector('.ai-opinion-loading')).toBeInTheDocument()
    expect(container.querySelector('.skeleton-card')).toBeInTheDocument()
  })

  it('should render error state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('API error'),
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(screen.getByText('🤖')).toBeInTheDocument()
    expect(screen.getByText('AI Analysis Unavailable')).toBeInTheDocument()
    expect(screen.getByText('Unable to load investment opinion')).toBeInTheDocument()
  })

  it('should render empty state when no data', () => {
    mockUseSWR.mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(screen.getByText('🔍')).toBeInTheDocument()
    expect(screen.getByText('Select a stock symbol for AI analysis')).toBeInTheDocument()
  })

  it('should render AI analysis data correctly', () => {
    mockUseSWR.mockReturnValue({
      data: mockAIAnalysisData,
      error: undefined,
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    // Recommendation header
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByText('📈')).toBeInTheDocument()
    expect(screen.getByText('Confidence: 85%')).toBeInTheDocument()
    expect(screen.getByText('Medium-term outlook')).toBeInTheDocument()

    // Price analysis
    expect(screen.getByText('Current Price')).toBeInTheDocument()
    expect(screen.getByText('$180.00')).toBeInTheDocument()
    expect(screen.getByText('Target Price')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByText('+11.11%')).toBeInTheDocument() // Upside calculation

    // Investment rating
    expect(screen.getByText('Investment Rating')).toBeInTheDocument()
    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText('Excellent')).toBeInTheDocument()

    // Analysis sections
    expect(screen.getByText('Analysis Details')).toBeInTheDocument()
  })

  it('should display correct recommendation colors and icons', () => {
    const testCases = [
      { recommendation: 'BUY' as const, icon: '📈' },
      { recommendation: 'SELL' as const, icon: '📉' },
      { recommendation: 'HOLD' as const, icon: '⏸️' }
    ]

    testCases.forEach(testCase => {
      mockUseSWR.mockReturnValue({
        data: { ...mockAIAnalysisData, recommendation: testCase.recommendation },
        error: undefined,
        isLoading: false
      })

      render(<AIInvestmentOpinion symbol="AAPL" />)
      
      expect(screen.getByText(testCase.recommendation)).toBeInTheDocument()
      expect(screen.getByText(testCase.icon)).toBeInTheDocument()
    })
  })

  it('should format prices and percentages correctly', () => {
    mockUseSWR.mockReturnValue({
      data: mockAIAnalysisData,
      error: undefined,
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(screen.getByText('$2.50 (+1.41%)')).toBeInTheDocument()
    expect(screen.getByText('+11.11%')).toBeInTheDocument() // Upside
  })

  it('should display rating labels correctly', () => {
    const testRatings = [
      { rating: 9, label: 'Excellent' },
      { rating: 7, label: 'Good' },
      { rating: 5, label: 'Fair' },
      { rating: 3, label: 'Poor' },
      { rating: 1, label: 'Very Poor' }
    ]

    testRatings.forEach(test => {
      mockUseSWR.mockReturnValue({
        data: { ...mockAIAnalysisData, investmentRating: test.rating },
        error: undefined,
        isLoading: false
      })

      render(<AIInvestmentOpinion symbol="AAPL" />)
      expect(screen.getByText(test.label)).toBeInTheDocument()
    })
  })

  it('should display disclaimer', () => {
    mockUseSWR.mockReturnValue({
      data: mockAIAnalysisData,
      error: undefined,
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(screen.getByText(/This analysis is AI-generated and should not be considered as financial advice/)).toBeInTheDocument()
  })

  it('should handle negative price changes', () => {
    const dataWithNegativeChange = {
      ...mockAIAnalysisData,
      priceChange: -2.50,
      priceChangePercent: -1.37
    }

    mockUseSWR.mockReturnValue({
      data: dataWithNegativeChange,
      error: undefined,
      isLoading: false
    })

    render(<AIInvestmentOpinion symbol="AAPL" />)

    expect(screen.getByText('$-2.50 (-1.37%)')).toBeInTheDocument()
  })
})