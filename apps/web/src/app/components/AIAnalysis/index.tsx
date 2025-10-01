'use client';

import React from 'react';
import StockProfile from './StockProfile';
import AIInvestmentOpinion from './AIInvestmentOpinion';

interface AIAnalysisProps {
  symbol: string;
}

export default function AIAnalysis({ symbol }: AIAnalysisProps) {
  return (
    <div className="ai-analysis-container">
      {/* Stock Profile Section */}
      <div className="ai-analysis-subsection">
        <div className="subsection-header">
          <h3>📊 Stock Profile</h3>
        </div>
        <div className="subsection-content">
          <StockProfile symbol={symbol} />
        </div>
      </div>

      {/* AI Investment Opinion Section */}
      <div className="ai-analysis-subsection">
        <div className="subsection-header">
          <h3>🤖 AI Investment Opinion</h3>
        </div>
        <div className="subsection-content">
          <AIInvestmentOpinion symbol={symbol} />
        </div>
      </div>
    </div>
  );
}

export { StockProfile };
export { AIOpinionCard } from '../AIOpinion';
// Legacy component - deprecated in favor of AIOpinionCard
export { default as AIInvestmentOpinion } from './AIInvestmentOpinion';