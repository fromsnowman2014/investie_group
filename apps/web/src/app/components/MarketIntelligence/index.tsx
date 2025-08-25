'use client';

import React from 'react';
import EnhancedMacroIndicatorsDashboard from './EnhancedMacroIndicatorsDashboard';
import AINewsAnalysisReport from './AINewsAnalysisReport';

interface MarketIntelligenceProps {
  symbol: string;
}

export default function MarketIntelligence({ symbol }: MarketIntelligenceProps) {
  return (
    <div className="market-intelligence-container">
      {/* Enhanced Macro Indicators Section */}
      <div className="market-intelligence-subsection">
        <div className="subsection-content">
          <EnhancedMacroIndicatorsDashboard />
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

// Export the enhanced component as the main MacroIndicatorsDashboard
export { EnhancedMacroIndicatorsDashboard as MacroIndicatorsDashboard, AINewsAnalysisReport };