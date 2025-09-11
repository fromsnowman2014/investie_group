import { useEffect, useRef } from 'react'

// Removed unused interface TradingViewWidgetConfig

interface UseTradingViewWidgetOptions {
  widgetType: 'advanced-chart' | 'technical-analysis' | 'fundamental-data' | 'company-profile' | 'top-stories' | 'ticker-tape' | 'symbol-info'
  symbol?: string
  config?: Record<string, unknown>
  dependencies?: unknown[]
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: unknown) => void
      MediumWidget: new (config: unknown) => void
    }
  }
}

const widgetConfigs = {
  'advanced-chart': (symbol: string, config: Record<string, unknown>) => ({
    width: '100%',
    height: '100%',
    symbol: symbol,
    interval: 'D',
    timezone: 'America/New_York',
    theme: 'light',
    style: '1',
    locale: 'en',
    toolbar_bg: '#f1f3f6',
    enable_publishing: false,
    allow_symbol_change: true,
    container_id: 'tradingview_chart',
    ...config
  }),

  'technical-analysis': (symbol: string, config: Record<string, unknown>) => ({
    interval: 'D',
    width: '100%',
    isTransparent: false,
    height: '100%',
    symbol: symbol,
    showIntervalTabs: true,
    locale: 'en',
    colorTheme: 'light',
    ...config
  }),

  'fundamental-data': (symbol: string, config: Record<string, unknown>) => ({
    symbol: symbol,
    colorTheme: 'light',
    isTransparent: false,
    largeChartUrl: '',
    displayMode: 'regular',
    width: '100%',
    height: '100%',
    ...config
  }),

  'company-profile': (symbol: string, config: Record<string, unknown>) => ({
    symbol: symbol,
    width: '100%',
    height: '100%',
    colorTheme: 'light',
    isTransparent: false,
    locale: 'en',
    ...config
  }),

  'top-stories': (symbol: string, config: Record<string, unknown>) => ({
    feedMode: 'symbol',
    symbol: symbol,
    isTransparent: false,
    displayMode: 'regular',
    width: '100%',
    height: '100%',
    colorTheme: 'light',
    locale: 'en',
    ...config
  }),

  'ticker-tape': (_symbol: string, config: Record<string, unknown>) => ({
    symbols: [
      { proName: 'OANDA:SPX500USD', title: 'S&P 500' },
      { proName: 'OANDA:NAS100USD', title: 'Nasdaq 100' },
      { proName: 'FX_IDC:EURUSD', title: 'EUR to USD' },
      { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
      { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' }
    ],
    showSymbolLogo: true,
    isTransparent: false,
    displayMode: 'adaptive',
    colorTheme: 'light',
    locale: 'en',
    ...config
  }),

  'symbol-info': (symbol: string, config: Record<string, unknown>) => ({
    symbol: symbol,
    width: '100%',
    locale: 'en',
    colorTheme: 'light',
    isTransparent: false,
    ...config
  })
}

export function useTradingViewWidget({
  widgetType,
  symbol = 'AAPL',
  config = {},
  dependencies = []
}: UseTradingViewWidgetOptions) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return

    // Clear any existing content
    container.innerHTML = ''

    const widgetConfig = widgetConfigs[widgetType](symbol, config)

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + widgetType.replace('_', '-') + '.js'
    script.type = 'text/javascript'
    script.async = true

    // Add widget configuration
    script.innerHTML = JSON.stringify({
      ...widgetConfig,
      container_id: container.id || `tradingview-${widgetType}-${Date.now()}`
    })

    // Assign unique ID if not present
    if (!container.id) {
      container.id = `tradingview-${widgetType}-${Date.now()}`
    }

    container.appendChild(script)

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetType, symbol, JSON.stringify(config), JSON.stringify(dependencies)])

  return containerRef
}