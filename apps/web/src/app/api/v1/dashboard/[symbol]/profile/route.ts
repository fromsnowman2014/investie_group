import { NextResponse } from 'next/server';

// Mock stock profile data
const generateStockProfile = (symbol: string) => {
  interface StockProfileData {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    description: string;
    marketCap: number;
    employees: number;
    founded: number;
    headquarters: string;
    website: string;
    ceo: string;
    exchange: string;
    currency: string;
    country: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
    pe: number;
    eps: number;
    dividend: number;
    dividendYield: number;
    beta: number;
    high52Week: number;
    low52Week: number;
    lastUpdated: string;
  }

  const profiles: Record<string, StockProfileData> = {
    AAPL: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      marketCap: 3000000000000,
      employees: 164000,
      founded: 1976,
      headquarters: 'Cupertino, CA',
      website: 'https://www.apple.com',
      ceo: 'Tim Cook',
      exchange: 'NASDAQ',
      currency: 'USD',
      country: 'United States',
      price: 185.45,
      change: 2.15,
      changePercent: 1.17,
      volume: 45250000,
      avgVolume: 52000000,
      pe: 28.5,
      eps: 6.51,
      dividend: 0.94,
      dividendYield: 0.51,
      beta: 1.24,
      high52Week: 199.62,
      low52Week: 164.08,
      lastUpdated: new Date().toISOString()
    },
    MSFT: {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology', 
      industry: 'Software',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
      marketCap: 2800000000000,
      employees: 221000,
      founded: 1975,
      headquarters: 'Redmond, WA',
      website: 'https://www.microsoft.com',
      ceo: 'Satya Nadella',
      exchange: 'NASDAQ',
      currency: 'USD',
      country: 'United States',
      price: 415.26,
      change: -1.25,
      changePercent: -0.30,
      volume: 28750000,
      avgVolume: 31000000,
      pe: 32.1,
      eps: 12.93,
      dividend: 2.72,
      dividendYield: 0.65,
      beta: 0.89,
      high52Week: 467.43,
      low52Week: 362.90,
      lastUpdated: new Date().toISOString()
    }
  };

  // Return specific profile or default AAPL
  return profiles[symbol.toUpperCase()] || {
    ...profiles.AAPL,
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corp`,
    description: `Mock profile data for ${symbol.toUpperCase()}`,
    lastUpdated: new Date().toISOString()
  };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required'
      }, { status: 400 });
    }

    const profile = generateStockProfile(symbol);
    
    const response = NextResponse.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in profile API:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch stock profile'
    }, { status: 500 });

    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}