// Enhanced type definitions for StockProfile enhancements

export interface StockMarketData {
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  source: string;
  // Rate limit information from Alpha Vantage
  alphaVantageRateLimit?: {
    isLimited: boolean;
    message?: string;
    resetTime?: string;
    availableTomorrow?: boolean;
  };
}

export interface AIAnalysisData {
  recommendation: string;
  confidence: number;
  summary: string;
  factors: string[];
  risk: 'low' | 'medium' | 'high';
}

export interface NewsSentimentData {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  headlines: NewsItem[];
}

export interface NewsItem {
  title: string;
  summary?: string;
  url?: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SectorComparisonData {
  sectorName: string;
  sectorAverage: number;
  ranking: number;
  peers: PeerStock[];
}

export interface PeerStock {
  symbol: string;
  name: string;
  pe?: number;
  marketCap?: number;
  performance?: number;
}

export interface EnhancedStockProfileData {
  // Existing profile data (preserved)
  profileData?: {
    symbol: string;
    companyName: string;
    sector: string;
    industry: string;
    country: string;
    marketCap: number;
    peRatio: number;
    dividendYield: number;
    description: string;
    employees: number;
    founded: string;
    headquarters: string;
    website: string;
  };

  // Phase 1: Real-time market data
  marketData?: StockMarketData;

  // Phase 2: AI insights (optional)
  aiAnalysis?: AIAnalysisData;

  // Phase 2: News sentiment (optional)
  newsSentiment?: NewsSentimentData;

  // Phase 3: Sector context (optional)
  sectorComparison?: SectorComparisonData;
}

export interface PriceChangeInfo {
  value: number;
  formatted: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
}

export interface FormattedMarketData {
  price: string;
  change: PriceChangeInfo;
  changePercent: PriceChangeInfo;
  volume?: string;
  marketCap?: string;
  pe?: string;
  fiftyTwoWeekRange?: string;
}