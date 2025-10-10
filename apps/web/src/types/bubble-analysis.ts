/**
 * Type definitions for Market Bubble Detector
 * Comprehensive bubble risk analysis with 10 indicator categories
 */

export type BubbleVerdict = 'peak' | 'near-peak' | 'elevated' | 'normal';
export type IndicatorLevel = 'extreme' | 'elevated' | 'normal';
export type IndicatorIcon = '🔴' | '🟡' | '🟢';
export type HistoricalBubble = '1929' | '1987' | '2000' | '2008' | '2021' | 'none';

export interface IndicatorScore {
  score: IndicatorLevel;
  icon: IndicatorIcon;
  summary: string;
}

export interface BubbleIndicators {
  leverageCredit: IndicatorScore;
  valuations: IndicatorScore;
  ipoActivity: IndicatorScore;
  speculation: IndicatorScore;
  monetaryPolicy: IndicatorScore;
  marketBreadth: IndicatorScore;
  sentiment: IndicatorScore;
  mediaCulture: IndicatorScore;
  historicalPatterns: IndicatorScore;
  contrarianSignals: IndicatorScore;
}

export interface HistoricalComparison {
  mostSimilarBubble: HistoricalBubble;
  similarities: string[];
  differences: string[];
}

export interface RiskAssessment {
  correctionProbability: number; // 0-100
  vulnerableSectors: string[];
  potentialCatalysts: string[];
}

export interface BubbleTimeline {
  projectedPeakTimeframe: string;
  typicalDuration: string;
  reversalCatalysts: string[];
}

export interface BubbleRecommendations {
  conservative: string;
  moderate: string;
  aggressive: string;
}

export interface BubbleAnalysisData {
  success: boolean;

  // Executive Summary
  verdict: BubbleVerdict;
  verdictText: string;

  // Indicator Scoring Matrix (10 categories)
  indicators: BubbleIndicators;

  // Key Evidence
  keyEvidence: string[];

  // Historical Context
  historicalComparison: HistoricalComparison;

  // Risk Assessment
  riskAssessment: RiskAssessment;

  // Timeline (optional - if bubble detected)
  timeline?: BubbleTimeline;

  // Contrarian View
  contrarianViewpoint: string[];

  // Recommendations
  recommendations: BubbleRecommendations;

  // Metadata
  lastUpdated: string;
  source: string;
  analysisDate: string;
  error?: string;
}

export interface BubbleAnalysisResponse {
  success: boolean;
  data?: BubbleAnalysisData;
  error?: string;
}
