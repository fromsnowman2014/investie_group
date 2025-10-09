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
  return await fetchMarketOverviewDirect() as MarketOverviewData;
}

/**
 * Fetch AI investment opinion for a given stock symbol
 */
export async function fetchAIOpinion(symbol: string) {
  const apiUrl = '/api/v1/ai-opinion';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      throw new Error(`AI Opinion API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ AI Opinion fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch AI company analysis for a given stock symbol
 */
export async function fetchCompanyAnalysis(symbol: string, companyData?: Record<string, unknown>) {
  const apiUrl = '/api/v1/ai-company-analysis';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, companyData }),
    });

    if (!response.ok) {
      throw new Error(`Company Analysis API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Company Analysis fetch failed:', error);
    throw error;
  }
}
