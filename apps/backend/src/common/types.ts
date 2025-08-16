// Shared TypeScript types for the backend
export type StockSymbol = 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' 
                         | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD';

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

export interface AIEvaluation {
  rating: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  summary: string;
  keyFactors: string[];
  timeframe: '1M' | '3M' | '1Y';
  source: 'claude_ai';
  lastUpdated: string;
}

export interface StockTechnicals {
  rsi: number;
  sma20: number;
  sma50: number;
  volume: number;
  signals: {
    trend: 'bullish' | 'bearish' | 'neutral';
    strength: 'strong' | 'moderate' | 'weak';
  };
}

export interface StockNewsSummary {
  headline: string;
  source: string;
}

export interface MarketSummaryData {
  fearGreedIndex: {
    value: number;
    status: 'fear' | 'neutral' | 'greed';
    source: string;
  };
  vix: {
    value: number;
    status: 'low' | 'medium' | 'high';
  };
  interestRate: {
    value: number;
    aiOutlook: string; // Claude AI analysis
  };
  cpi: {
    value: number;
    monthOverMonth: number;
    direction: 'up' | 'down' | 'stable';
  };
}

// News service types
export interface NewsProcessingResult {
  isValid: boolean;
  symbol?: StockSymbol;
  overview?: StockOverview;
  stockNews?: StockNewsWithArticles;
  macroNews?: MacroNewsData;
  validationResult?: ValidationResult;
  error?: string;
  suggestions?: string[];
}

export interface StockNewsWithArticles {
  headline: string;
  source: string;
  articles: SerpApiNewsResult[];
  query?: string;
}

export interface ValidationResult {
  isValid: boolean;
  method: string;
  symbol: string;
  reason: string;
  price?: number;
}

export interface StockOverview {
  symbol: StockSymbol;
  overview: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
  source: string;
  timestamp: string;
}

export interface MacroNewsData {
  topHeadline: string;
  articles: SerpApiNewsResult[];
  totalArticles: number;
  source: string;
  timestamp: string;
  query?: string;
}

export interface SerpApiNewsResult {
  title: string;
  link: string;
  snippet?: string;
  date: string;
  source: string;
}

// Health check types
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    [key: string]: boolean;
  };
}