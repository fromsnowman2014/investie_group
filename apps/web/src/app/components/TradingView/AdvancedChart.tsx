'use client';

import { useEffect, useRef } from 'react';
import { useStock } from '../StockProvider';

export default function AdvancedChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentSymbol } = useStock();

  useEffect(() => {
    const container = containerRef.current;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: "D",
      locale: "en",
      save_image: true,
      style: "1",
      symbol: `NASDAQ:${currentSymbol}`,
      theme: "light",
      timezone: "Etc/UTC",
      backgroundColor: "#ffffff",
      gridColor: "rgba(46, 46, 46, 0.06)",
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true
    });

    if (container) {
      const widget = document.createElement('div');
      widget.className = 'tradingview-widget-container';
      widget.style.height = '100%';
      widget.style.width = '100%';
      const widgetInner = document.createElement('div');
      widgetInner.className = 'tradingview-widget-container__widget';
      widgetInner.style.height = 'calc(100% - 32px)';
      widgetInner.style.width = '100%';
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
    <section id="advanced-chart" className="advanced-chart widget-container span-full-grid" ref={containerRef}>
      {/* Advanced Chart Widget */}
    </section>
  );
}