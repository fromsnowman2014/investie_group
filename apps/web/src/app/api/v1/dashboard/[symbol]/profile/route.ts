import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple in-memory cache
interface CacheEntry {
  data: StockProfileData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface StockProfileData {
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
}

interface YahooQuoteResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        currency: string;
      };
    }>;
  };
}

interface AlphaVantageOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  Country: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  Address: string;
  FullTimeEmployees: string;
  [key: string]: string;
}

function getCachedResult(symbol: string): StockProfileData | null {
  const entry = cache.get(symbol);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(symbol);
    return null;
  }

  return entry.data;
}

function setCachedResult(symbol: string, data: StockProfileData): void {
  cache.set(symbol, {
    data,
    timestamp: Date.now()
  });

  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
}

async function fetchFromAlphaVantage(symbol: string): Promise<StockProfileData | null> {
  const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';

  if (apiKey === 'demo') {
    console.log('⚠️ Using demo API key for Alpha Vantage');
  }

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;

  try {
    console.log(`📊 Fetching profile from Alpha Vantage for ${symbol}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json() as AlphaVantageOverview;

    // Check if we got rate limited or empty response
    if (!data.Symbol || data.Symbol !== symbol) {
      console.log(`⚠️ Alpha Vantage returned incomplete data for ${symbol}`);
      return null;
    }

    const marketCap = parseFloat(data.MarketCapitalization || '0');
    const peRatio = parseFloat(data.PERatio || '0');
    const dividendYield = parseFloat(data.DividendYield || '0');
    const employees = parseInt(data.FullTimeEmployees || '0');

    return {
      symbol: data.Symbol,
      companyName: data.Name || symbol,
      sector: data.Sector || 'Technology',
      industry: data.Industry || 'Software',
      country: data.Country || 'USA',
      marketCap,
      peRatio,
      dividendYield,
      description: data.Description || `${data.Name} is a leading company in the ${data.Sector || 'technology'} sector.`,
      employees,
      founded: data.Address?.includes('Founded') ? data.Address.split('Founded')[1].trim() : 'N/A',
      headquarters: data.Address || 'USA',
      website: `https://finance.yahoo.com/quote/${symbol}`,
    };
  } catch (error) {
    console.error('❌ Alpha Vantage fetch failed:', error);
    return null;
  }
}

function getMockProfileData(symbol: string): StockProfileData {
  const mockData: Record<string, Partial<StockProfileData>> = {
    AAPL: {
      companyName: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      country: 'USA',
      marketCap: 3200000000000,
      peRatio: 28.5,
      dividendYield: 0.005,
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company is known for its innovative products including iPhone, Mac, iPad, Apple Watch, and services like App Store, Apple Music, and iCloud.',
      employees: 161000,
      founded: '1976',
      headquarters: 'Cupertino, California, USA',
      website: 'https://www.apple.com',
    },
    TSLA: {
      companyName: 'Tesla, Inc.',
      sector: 'Automotive',
      industry: 'Electric Vehicles',
      country: 'USA',
      marketCap: 800000000000,
      peRatio: 65.2,
      dividendYield: 0,
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems worldwide. The company is a leader in electric vehicle technology and sustainable energy solutions.',
      employees: 127855,
      founded: '2003',
      headquarters: 'Austin, Texas, USA',
      website: 'https://www.tesla.com',
    },
    MSFT: {
      companyName: 'Microsoft Corporation',
      sector: 'Technology',
      industry: 'Software',
      country: 'USA',
      marketCap: 2800000000000,
      peRatio: 32.1,
      dividendYield: 0.008,
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.',
      employees: 221000,
      founded: '1975',
      headquarters: 'Redmond, Washington, USA',
      website: 'https://www.microsoft.com',
    },
    GOOGL: {
      companyName: 'Alphabet Inc.',
      sector: 'Technology',
      industry: 'Internet Services',
      country: 'USA',
      marketCap: 1900000000000,
      peRatio: 26.8,
      dividendYield: 0,
      description: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. The company operates through Google Services, Google Cloud, and Other Bets segments.',
      employees: 190234,
      founded: '1998',
      headquarters: 'Mountain View, California, USA',
      website: 'https://www.google.com',
    },
    NVDA: {
      companyName: 'NVIDIA Corporation',
      sector: 'Technology',
      industry: 'Semiconductors',
      country: 'USA',
      marketCap: 1200000000000,
      peRatio: 55.3,
      dividendYield: 0.001,
      description: 'NVIDIA Corporation provides graphics, and compute and networking solutions worldwide. The company operates through two segments: Graphics and Compute & Networking. It is a leader in AI computing and GPU technology.',
      employees: 29600,
      founded: '1993',
      headquarters: 'Santa Clara, California, USA',
      website: 'https://www.nvidia.com',
    },
  };

  const defaultData = mockData[symbol] || {
    companyName: `${symbol} Inc.`,
    sector: 'Technology',
    industry: 'Software',
    country: 'USA',
    marketCap: 100000000000,
    peRatio: 25.0,
    dividendYield: 0.01,
    description: `${symbol} is a leading company in the technology sector.`,
    employees: 50000,
    founded: '2000',
    headquarters: 'USA',
    website: `https://finance.yahoo.com/quote/${symbol}`,
  };

  return {
    symbol,
    ...defaultData,
  } as StockProfileData;
}

async function fetchStockProfile(symbol: string): Promise<StockProfileData> {
  // Check cache first
  const cached = getCachedResult(symbol);
  if (cached) {
    console.log(`🎯 Cache hit for profile ${symbol}`);
    return cached;
  }

  console.log(`🚀 Fetching fresh profile data for ${symbol}`);

  // Try Alpha Vantage first
  const alphaVantageData = await fetchFromAlphaVantage(symbol);

  if (alphaVantageData) {
    setCachedResult(symbol, alphaVantageData);
    return alphaVantageData;
  }

  // Fallback to mock data
  console.log(`⚠️ Using mock data for ${symbol}`);
  const mockData = getMockProfileData(symbol);
  setCachedResult(symbol, mockData);
  return mockData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const profileData = await fetchStockProfile(symbol.toUpperCase());

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('❌ Stock Profile API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch stock profile: ${errorMessage}` },
      { status: 500 }
    );
  }
}
