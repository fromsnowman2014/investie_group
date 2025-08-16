'use client';

import { useEffect, useRef } from 'react';

export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const script1 = document.createElement('script');
    script1.src = 'https://s3.tradingview.com/external-embedding/embed-widget-tickers.js';
    script1.async = true;
    script1.innerHTML = JSON.stringify({
      symbols: [
        {
          proName: "FRED:DJIA",
          title: "Dow Jones"
        },
        {
          proName: "SPREADEX:SPX",
          title: "S&P 500"
        },
        {
          proName: "NASDAQ:IXIC",
          title: "NASDAQ"
        },
        {
          proName: "IG:RUSSELL",
          title: "Russell"
        },
        {
          proName: "BITSTAMP:BTCUSD",
          title: "Bitcoin"
        },
        {
          proName: "BITSTAMP:ETHUSD",
          title: "Ethereum"
        }
      ],
      colorTheme: "light",
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true
    });

    const script2 = document.createElement('script');
    script2.src = 'https://s3.tradingview.com/external-embedding/embed-widget-tickers.js';
    script2.async = true;
    script2.innerHTML = JSON.stringify({
      symbols: [
        {
          proName: "PYTH:US02Y",
          title: "US 2yr Bond"
        },
        {
          proName: "PYTH:US10Y",
          title: "US 10yr Bond"
        },
        {
          proName: "MARKETSCOM:OIL",
          title: "Oil"
        },
        {
          proName: "CAPITALCOM:GOLD",
          title: "Gold"
        },
        {
          proName: "NASDAQ:MSTR",
          title: "MicroStrategy"
        },
        {
          proName: "AMEX:BMNR",
          title: "Bitmine"
        }
      ],
      colorTheme: "light",
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true
    });

    if (container) {
      const widget1 = document.createElement('div');
      widget1.className = 'tradingview-widget-container';
      const widgetInner1 = document.createElement('div');
      widgetInner1.className = 'tradingview-widget-container__widget';
      widget1.appendChild(widgetInner1);
      widget1.appendChild(script1);

      const widget2 = document.createElement('div');
      widget2.className = 'tradingview-widget-container';
      const widgetInner2 = document.createElement('div');
      widgetInner2.className = 'tradingview-widget-container__widget';
      widget2.appendChild(widgetInner2);
      widget2.appendChild(script2);

      container.appendChild(widget1);
      container.appendChild(widget2);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <nav className="ticker-tape widget-container" ref={containerRef}>
      {/* TradingView widgets will be inserted here */}
    </nav>
  );
}