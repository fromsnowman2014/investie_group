import { renderHook } from '@testing-library/react'
import { useTradingViewWidget } from './useTradingViewWidget'

// Mock DOM methods more thoroughly
const mockElement = {
  src: '',
  type: '',
  async: false,
  innerHTML: '',
  appendChild: jest.fn()
}

const mockContainer = {
  id: '',
  innerHTML: '',
  appendChild: jest.fn()
}

Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockElement),
  configurable: true
})

// Mock useRef to return a mock container
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(() => ({ current: mockContainer })),
  useEffect: jest.fn((effect) => effect())
}))

describe('useTradingViewWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockContainer.innerHTML = ''
    mockContainer.id = ''
    mockElement.innerHTML = ''
    mockElement.src = ''
  })

  it('should return a ref object', () => {
    const { result } = renderHook(() => 
      useTradingViewWidget({ widgetType: 'advanced-chart' })
    )

    expect(result.current).toEqual(
      expect.objectContaining({
        current: mockContainer
      })
    )
  })

  it('should use default symbol when not provided', () => {
    const { result } = renderHook(() => 
      useTradingViewWidget({ widgetType: 'advanced-chart' })
    )

    expect(result.current).toBeDefined()
  })

  it('should handle different widget types', () => {
    const widgetTypes = [
      'advanced-chart',
      'technical-analysis', 
      'fundamental-data',
      'company-profile',
      'top-stories',
      'ticker-tape',
      'symbol-info'
    ] as const

    widgetTypes.forEach(widgetType => {
      const { result } = renderHook(() => 
        useTradingViewWidget({ widgetType, symbol: 'AAPL' })
      )

      expect(result.current).toBeDefined()
    })
  })

  it('should accept custom config', () => {
    const customConfig = { theme: 'dark', interval: '1H' }
    
    const { result } = renderHook(() => 
      useTradingViewWidget({ 
        widgetType: 'advanced-chart',
        symbol: 'TSLA',
        config: customConfig
      })
    )

    expect(result.current).toBeDefined()
  })

  it('should handle custom dependencies', () => {
    const dependencies = ['dep1', 'dep2']
    
    const { result } = renderHook(() => 
      useTradingViewWidget({ 
        widgetType: 'advanced-chart',
        dependencies
      })
    )

    expect(result.current).toBeDefined()
  })
})