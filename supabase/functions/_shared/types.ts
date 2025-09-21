// Shared types for Supabase Edge Functions
// This file contains common type definitions used across multiple functions

// Cache-related types
export interface CachedMarketData {
  id?: number;
  indicator_type: string;
  data_value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  data_source: string;
  created_at: string;
  expires_at?: string;
  age_seconds?: number;
  source?: 'cache' | 'realtime' | 'fallback';
  freshness?: MarketDataFreshness;
}

export interface MarketDataFreshness {
  ageInSeconds: number;
  ageInHours: number;
  freshness: number;
  isStale: boolean;
}

// Market data types
export interface IndexData {
  value: number;
  change: number;
  changePercent: number;
}

export interface SectorData {
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

// Response types
export interface MarketOverviewResponse {
  indices: {
    sp500: IndexData;
    nasdaq: IndexData;
    dow: IndexData;
  };
  sectors: SectorData[];
  economicIndicators?: {
    interestRate?: EconomicIndicator;
    cpi?: EconomicIndicator;
    unemployment?: EconomicIndicator;
  };
  fearGreedIndex?: FearGreedIndex;
  vix?: VIXData;
  marketSentiment: string;
  volatilityIndex: number;
  source: string;
  lastUpdated: string;
  cacheInfo?: CacheInfo;
}

export interface CacheInfo {
  totalIndicators: number;
  freshIndicators: number;
  staleIndicators: number;
  cacheHitRate: number;
}

export interface DatabaseReaderResponse {
  fearGreedIndex?: CachedMarketData;
  economicIndicators?: CachedMarketData[];
  marketIndicators?: CachedMarketData[];
  sp500Data?: CachedMarketData;
  vixData?: CachedMarketData;
  lastUpdated: string;
  source: 'cache' | 'mixed' | 'realtime';
  cacheInfo: CacheInfo;
}

// API request types
export interface CachedDataQuery {
  indicatorType?: string;
  maxAge?: number;
  fallbackToAPI?: boolean;
  forceRefresh?: boolean;
  action: string;
}

// Error response type
export interface ErrorResponse {
  error: string;
  message?: string;
  timestamp: string;
  status?: number;
}

// Success response wrapper
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Standard API response
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;