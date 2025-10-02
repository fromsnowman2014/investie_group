import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple in-memory cache
interface CacheEntry {
  data: NewsAnalysisData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface NewsAnalysisData {
  symbol: string;
  articles: Array<{
    title: string;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    source: string;
    publishedAt: string;
    url: string;
  }>;
  overallSentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  lastUpdated: string;
}

function getCachedResult(symbol: string): NewsAnalysisData | null {
  const entry = cache.get(symbol);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(symbol);
    return null;
  }

  return entry.data;
}

function setCachedResult(symbol: string, data: NewsAnalysisData): void {
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

function getMockNewsData(symbol: string): NewsAnalysisData {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const mockNews: Record<string, NewsAnalysisData> = {
    AAPL: {
      symbol: 'AAPL',
      articles: [
        {
          title: 'Apple Announces Record-Breaking iPhone Sales',
          summary: 'Apple Inc. reported better-than-expected iPhone sales in Q4, driven by strong demand for the latest iPhone models.',
          sentiment: 'positive',
          source: 'Reuters',
          publishedAt: now.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
        },
        {
          title: 'New Apple Vision Pro Features Revealed',
          summary: 'Apple showcased new features for Vision Pro at its developer conference, focusing on productivity and entertainment.',
          sentiment: 'positive',
          source: 'Bloomberg',
          publishedAt: yesterday.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
        },
        {
          title: 'Apple Services Revenue Grows 15% Year-over-Year',
          summary: 'The company\'s services division continues to show strong growth, with App Store and iCloud leading the way.',
          sentiment: 'positive',
          source: 'CNBC',
          publishedAt: twoDaysAgo.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
        },
      ],
      overallSentiment: 'positive',
      sentimentScore: 85,
      lastUpdated: now.toISOString(),
    },
    TSLA: {
      symbol: 'TSLA',
      articles: [
        {
          title: 'Tesla Cybertruck Production Ramps Up',
          summary: 'Tesla is increasing Cybertruck production capacity to meet strong customer demand.',
          sentiment: 'positive',
          source: 'Reuters',
          publishedAt: now.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
        },
        {
          title: 'EV Market Competition Intensifies',
          summary: 'Traditional automakers are launching new electric vehicles, increasing competition in the EV market.',
          sentiment: 'neutral',
          source: 'Wall Street Journal',
          publishedAt: yesterday.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
        },
        {
          title: 'Tesla Expands Supercharger Network in Europe',
          summary: 'The company announced plans to add 500 new Supercharger stations across Europe in 2025.',
          sentiment: 'positive',
          source: 'Bloomberg',
          publishedAt: twoDaysAgo.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
        },
      ],
      overallSentiment: 'positive',
      sentimentScore: 72,
      lastUpdated: now.toISOString(),
    },
  };

  return mockNews[symbol] || {
    symbol,
    articles: [
      {
        title: `${symbol} Stock Analysis Update`,
        summary: `Recent market activity shows ${symbol} maintaining steady performance amid market volatility.`,
        sentiment: 'neutral',
        source: 'Market Watch',
        publishedAt: now.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
      },
      {
        title: `Analysts Update ${symbol} Price Targets`,
        summary: `Several Wall Street analysts have updated their price targets for ${symbol} following recent earnings.`,
        sentiment: 'neutral',
        source: 'Financial Times',
        publishedAt: yesterday.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
      },
      {
        title: `${symbol} Market Performance Review`,
        summary: `A comprehensive look at ${symbol}'s recent market performance and outlook for the coming quarter.`,
        sentiment: 'neutral',
        source: 'Bloomberg',
        publishedAt: twoDaysAgo.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
      },
    ],
    overallSentiment: 'neutral',
    sentimentScore: 50,
    lastUpdated: now.toISOString(),
  };
}

async function fetchNewsAnalysis(symbol: string): Promise<NewsAnalysisData> {
  // Check cache first
  const cached = getCachedResult(symbol);
  if (cached) {
    console.log(`🎯 Cache hit for news analysis ${symbol}`);
    return cached;
  }

  console.log(`🚀 Fetching fresh news analysis for ${symbol}`);

  // For now, return mock data
  // In production, this would call a news API (NewsAPI, Finnhub, etc.)
  const newsData = getMockNewsData(symbol);
  setCachedResult(symbol, newsData);
  return newsData;
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

    const newsData = await fetchNewsAnalysis(symbol.toUpperCase());

    return NextResponse.json(newsData);
  } catch (error) {
    console.error('❌ News Analysis API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch news analysis: ${errorMessage}` },
      { status: 500 }
    );
  }
}
