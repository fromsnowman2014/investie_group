import React from 'react'
import { render, screen } from '@/test-utils'
import AIAnalysis from './index'

// Mock the sub-components
jest.mock('./StockProfile', () => {
  return function MockStockProfile({ symbol }: { symbol: string }) {
    return <div data-testid="stock-profile">Stock Profile for {symbol}</div>
  }
})

jest.mock('./AIInvestmentOpinion', () => {
  return function MockAIInvestmentOpinion({ symbol }: { symbol: string }) {
    return <div data-testid="ai-investment-opinion">AI Opinion for {symbol}</div>
  }
})

describe('AIAnalysis Component', () => {
  it('should render both StockProfile and AIInvestmentOpinion', () => {
    render(<AIAnalysis symbol="AAPL" />)

    expect(screen.getByText('📊 Stock Profile')).toBeInTheDocument()
    expect(screen.getByText('🤖 AI Investment Opinion')).toBeInTheDocument()
    expect(screen.getByTestId('stock-profile')).toBeInTheDocument()
    expect(screen.getByTestId('ai-investment-opinion')).toBeInTheDocument()
  })

  it('should pass symbol prop to both components', () => {
    render(<AIAnalysis symbol="TSLA" />)

    expect(screen.getByText('Stock Profile for TSLA')).toBeInTheDocument()
    expect(screen.getByText('AI Opinion for TSLA')).toBeInTheDocument()
  })

  it('should have proper structure with sections and headers', () => {
    const { container } = render(<AIAnalysis symbol="AAPL" />)

    expect(container.querySelector('.ai-analysis-container')).toBeInTheDocument()
    expect(container.querySelectorAll('.ai-analysis-subsection')).toHaveLength(2)
    expect(container.querySelectorAll('.subsection-header')).toHaveLength(2)
    expect(container.querySelectorAll('.subsection-content')).toHaveLength(2)
  })
})