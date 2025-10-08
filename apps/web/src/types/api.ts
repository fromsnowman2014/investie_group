// Stock symbol type - accepts any valid US stock ticker
export type StockSymbol = string;

// Popular stock symbols for UI convenience
export const POPULAR_STOCKS = [
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN',
  'NVDA', 'META', 'NFLX', 'AVGO', 'AMD',
  'JPM', 'BAC', 'JNJ', 'PFE', 'SPY', 'QQQ', 'VTI'
] as const;

// AI Evaluation interface
export interface AIEvaluation {
  rating: 'buy' | 'hold' | 'sell';
  confidence: number; // 0-100
  summary: string;
  keyFactors: string[];
  lastUpdated: string;
}

// Technical analysis interface
export interface StockTechnicals {
  rsi: number;
  sma20: number;
  sma50: number;
  support: number;
  resistance: number;
}

// News summary interface
export interface StockNewsSummary {
  headline: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevantArticles: number;
  lastUpdated: string;
}

// Main stock data interface
export interface StockCardData {
  symbol: StockSymbol;
  name: string;
  price: {
    current: number;
    change: number;
    changePercent: number;
    source: 'yahoo_finance' | 'direct_api';
  };
  fundamentals: {
    pe: number;
    marketCap: number;
    volume: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  aiEvaluation: AIEvaluation;
  technicals: StockTechnicals;
  newsSummary: StockNewsSummary;
  sectorPerformance: {
    name: string;
    weeklyChange: number;
  };
}

// Chart data interface
export interface ChartData {
  period: string;
  data: Array<{
    timestamp: string;
    price: number;
    volume: number;
  }>;
}

// Market overview interface (direct API response)
export interface MarketIndex {
  value: number;
  change: number;
  changePercent: number;
}

export interface SectorPerformance {
  name: string;
  change: number;
  performance: 'positive' | 'negative';
}

export interface MarketOverviewData {
  indices: {
    sp500: MarketIndex;
    nasdaq: MarketIndex;
    dow: MarketIndex;
  };
  sectors: SectorPerformance[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityIndex: number;
  source: string;
  lastUpdated?: string;
}

// Simplified API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  source: 'direct_api';
  error?: string;
}

// Health check interface for direct API
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  approach: 'direct_api';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  version: string;
}

// AI Investment Opinion interfaces
export interface InvestmentOpinionResult {
  success: boolean;
  symbol: string;
  opinion: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  keyFactors: string[];
  timeframe?: string;
  lastUpdated: string;
  source: string;
  error?: string;
}

export interface AIOpinionResponse {
  success: boolean;
  data: InvestmentOpinionResult;
  timestamp: string;
}