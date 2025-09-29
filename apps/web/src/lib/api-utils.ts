// Direct API utilities for market data fetching
import { fetchMarketOverviewDirect } from './direct-api';
import { MarketOverviewData } from '@/types/api';

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * Fetch market overview data using direct API integration
 */
export async function fetchMarketOverview(): Promise<MarketOverviewData> {
  console.log('🌐 Direct API: Fetching market overview data...');
  return await fetchMarketOverviewDirect() as MarketOverviewData;
}
