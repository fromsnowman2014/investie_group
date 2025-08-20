'use client';

import React from 'react';
import MacroIndicatorsDashboard from './MacroIndicatorsDashboard';
import AINewsAnalysisReport from './AINewsAnalysisReport';

interface MarketIntelligenceProps {
  symbol: string;
}

export default function MarketIntelligence({ symbol }: MarketIntelligenceProps) {
  return (
    <div className="market-intelligence-container">
      {/* Macro Indicators Section */}
      <div className="market-intelligence-subsection">
        <div className="subsection-header">
          <h3>📊 Macro Indicators</h3>
        </div>
        <div className="subsection-content">
          <MacroIndicatorsDashboard symbol={symbol} />
        </div>
      </div>

      {/* AI News Analysis Section */}
      <div className="market-intelligence-subsection">
        <div className="subsection-header">
          <h3>📰 AI News Analysis</h3>
        </div>
        <div className="subsection-content">
          <AINewsAnalysisReport symbol={symbol} />
        </div>
      </div>
    </div>
  );
}

export { MacroIndicatorsDashboard, AINewsAnalysisReport };