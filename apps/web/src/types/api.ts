// Stock symbol type - matches Supabase Edge Functions VALID_SYMBOLS
export type StockSymbol = 
  | 'AAPL' | 'TSLA' | 'MSFT' | 'GOOGL' | 'AMZN' 
  | 'NVDA' | 'META' | 'NFLX' | 'AVGO' | 'AMD'
  | 'JPM' | 'BAC' | 'JNJ' | 'PFE' | 'SPY' | 'QQQ' | 'VTI';

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

// Market overview interface (matches backend response)
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

export interface EconomicIndicator {
  value: number;
  previousValue?: number;
  change?: number;
  percentChange?: number;
  date: string;
  trend: 'rising' | 'falling' | 'stable';
  source: string;
}

export interface FearGreedIndex {
  value: number;
  status: string;
  confidence: number;
}

export interface VIXData {
  value: number;
  status: string;
  interpretation: string;
}

export interface CacheInfo {
  isFromCache: boolean;
  cacheHitRate: number;
  totalIndicators: number;
  freshIndicators: number;
  dataAge: number;
}

export interface MarketOverviewData {
  indices: {
    sp500: MarketIndex;
    nasdaq: MarketIndex;
    dow: MarketIndex;
  };
  sectors: SectorPerformance[];
  economicIndicators?: {
    interestRate?: EconomicIndicator;
    cpi?: EconomicIndicator;
    unemployment?: EconomicIndicator;
  };
  fearGreedIndex?: FearGreedIndex;
  vix?: VIXData;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityIndex: number;
  source: string;
  lastUpdated: string;
  cacheInfo?: CacheInfo;
}

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