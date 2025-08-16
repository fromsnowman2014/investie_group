'use client';

import { useEffect, useRef } from 'react';
import { useStock } from '../StockProvider';

export default function SymbolInfo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentSymbol } = useStock();

  useEffect(() => {
    const container = containerRef.current;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: `NASDAQ:${currentSymbol}`,
      colorTheme: "light",
      isTransparent: true,
      locale: "en",
      width: "100%"
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
    <section id="symbol-info" className="symbol-info widget-container span-one-column" ref={containerRef}>
      {/* Symbol Info Widget */}
    </section>
  );
}