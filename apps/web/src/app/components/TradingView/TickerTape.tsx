'use client';

import { useEffect, useRef } from 'react';

export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear container first
    container.innerHTML = '';

    // Configuration for compact ticker widgets
    const createTickerWidget = (symbols: Array<{proName: string, title: string}>) => {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-tickers.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbols,
        colorTheme: "light",
        locale: "en",
        largeChartUrl: "",
        isTransparent: false,
        showSymbolLogo: false,
        backgroundColor: "#ffffff",
        gridLineColor: "#e0e3eb",
        fontColor: "#000000"
      });

      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      
      const widgetInner = document.createElement('div');
      widgetInner.className = 'tradingview-widget-container__widget';
      
      widgetContainer.appendChild(widgetInner);
      widgetContainer.appendChild(script);
      
      return widgetContainer;
    };

    // Major Market Indices
    const majorIndices = [
      { proName: "FRED:DJIA", title: "Dow Jones" },
      { proName: "SPREADEX:SPX", title: "S&P 500" },
      { proName: "NASDAQ:IXIC", title: "NASDAQ" },
      { proName: "IG:RUSSELL", title: "Russell 2000" },
      { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
      { proName: "BITSTAMP:ETHUSD", title: "Ethereum" }
    ];

    // Bonds & Commodities
    const bondsAndCommodities = [
      { proName: "PYTH:US02Y", title: "US 2Y" },
      { proName: "PYTH:US10Y", title: "US 10Y" },
      { proName: "MARKETSCOM:OIL", title: "Oil" },
      { proName: "CAPITALCOM:GOLD", title: "Gold" },
      { proName: "FX_IDC:USDX", title: "DXY" },
      { proName: "FX_IDC:EURUSD", title: "EUR/USD" }
    ];

    // Create and append widgets
    const widget1 = createTickerWidget(majorIndices);
    const widget2 = createTickerWidget(bondsAndCommodities);
    
    container.appendChild(widget1);
    container.appendChild(widget2);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <nav className="ticker-tape widget-container" ref={containerRef} role="banner" aria-label="Market Data Ticker">
      {/* Market data loading indicator */}
      <div className="ticker-loading" aria-hidden="true">
        <span className="loading-text">Loading market data...</span>
      </div>
    </nav>
  );
}