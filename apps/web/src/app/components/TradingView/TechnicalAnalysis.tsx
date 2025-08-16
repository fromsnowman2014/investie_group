'use client';

import { useEffect, useRef } from 'react';
import { useStock } from '../StockProvider';

export default function TechnicalAnalysis() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentSymbol } = useStock();

  useEffect(() => {
    const container = containerRef.current;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      displayMode: "multiple",
      isTransparent: true,
      locale: "en",
      interval: "1D",
      disableInterval: false,
      width: "100%",
      height: "100%",
      symbol: `NASDAQ:${currentSymbol}`,
      showIntervalTabs: true
    });

    if (container) {
      const widget = document.createElement('span');
      widget.className = 'tradingview-widget-container';
      const widgetInner = document.createElement('span');
      widgetInner.className = 'tradingview-widget-container__widget';
      widget.appendChild(widgetInner);
      widget.appendChild(script);
      container.appendChild(widget);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [currentSymbol]);

  return (
    <section id="technical-analysis" className="technical-analysis widget-container span-one-column" ref={containerRef}>
      {/* Technical Analysis Widget */}
    </section>
  );
}