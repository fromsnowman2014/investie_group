// Shared types for Supabase Edge Functions
// This file contains common type definitions used across multiple functions

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
  timestamp?: string;
}

// API request types for real-time data fetching
export interface APIDataRequest {
  symbol?: string;
  indicators?: string[];
  forceRefresh?: boolean;
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