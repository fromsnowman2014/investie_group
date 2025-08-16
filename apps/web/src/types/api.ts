// Stock symbol type
export type StockSymbol = 
  | 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' 
  | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD';

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
    source: 'google_finance';
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

// Market overview interface
export interface MarketOverview {
  indices: {
    sp500: { value: number; change: number; changePercent: number };
    nasdaq: { value: number; change: number; changePercent: number };
    dowJones: { value: number; change: number; changePercent: number };
  };
  sectors: Array<{
    name: string;
    change: number;
    changePercent: number;
  }>;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  lastUpdated: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

// Health check interface
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  version: string;
}