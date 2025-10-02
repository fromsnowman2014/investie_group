import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple in-memory cache
interface CacheEntry {
  data: NewsAnalysisData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relevanceScore: number;
  source: string;
  publishedAt: string;
  url: string;
  topics: string[];
  impact: 'high' | 'medium' | 'low';
  aiAnalysis: {
    keyPoints: string[];
    marketImpact: string;
    tradingSignals: string[];
  };
}

interface NewsAnalysisData {
  symbol: string;
  news: NewsItem[];
  analytics: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    totalArticles: number;
    highImpactNews: number;
    trendingTopics: string[];
    lastUpdated: string;
  };
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
      news: [
        {
          id: '1',
          title: 'Apple Announces Record-Breaking iPhone Sales',
          summary: 'Apple Inc. reported better-than-expected iPhone sales in Q4, driven by strong demand for the latest iPhone models.',
          sentiment: 'positive',
          sentimentScore: 0.85,
          relevanceScore: 0.95,
          source: 'Reuters',
          publishedAt: now.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
          topics: ['Earnings', 'iPhone', 'Sales'],
          impact: 'high',
          aiAnalysis: {
            keyPoints: [
              'Q4 iPhone sales exceeded analyst expectations',
              'Strong demand in premium segment'
            ],
            marketImpact: 'Positive catalyst for stock price momentum',
            tradingSignals: ['Bullish momentum', 'High volume']
          }
        },
        {
          id: '2',
          title: 'New Apple Vision Pro Features Revealed',
          summary: 'Apple showcased new features for Vision Pro at its developer conference, focusing on productivity and entertainment.',
          sentiment: 'positive',
          sentimentScore: 0.75,
          relevanceScore: 0.80,
          source: 'Bloomberg',
          publishedAt: yesterday.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
          topics: ['Vision Pro', 'Innovation', 'AR/VR'],
          impact: 'medium',
          aiAnalysis: {
            keyPoints: [
              'Enhanced productivity features for enterprise',
              'New entertainment apps announced'
            ],
            marketImpact: 'Strengthens competitive position in AR/VR market',
            tradingSignals: ['Innovation driver', 'Long-term growth']
          }
        },
        {
          id: '3',
          title: 'Apple Services Revenue Grows 15% Year-over-Year',
          summary: 'The company\'s services division continues to show strong growth, with App Store and iCloud leading the way.',
          sentiment: 'positive',
          sentimentScore: 0.90,
          relevanceScore: 0.90,
          source: 'CNBC',
          publishedAt: twoDaysAgo.toISOString(),
          url: 'https://finance.yahoo.com/news/aapl',
          topics: ['Services', 'Revenue Growth', 'Recurring Revenue'],
          impact: 'high',
          aiAnalysis: {
            keyPoints: [
              'Services margin higher than hardware',
              'Subscription base expanding rapidly'
            ],
            marketImpact: 'Validates transition to recurring revenue model',
            tradingSignals: ['Margin expansion', 'Quality earnings']
          }
        },
      ],
      analytics: {
        overallSentiment: 'positive',
        sentimentScore: 85,
        totalArticles: 3,
        highImpactNews: 2,
        trendingTopics: ['Earnings', 'iPhone', 'Services', 'Innovation'],
        lastUpdated: now.toISOString(),
      }
    },
    TSLA: {
      symbol: 'TSLA',
      news: [
        {
          id: '1',
          title: 'Tesla Cybertruck Production Ramps Up',
          summary: 'Tesla is increasing Cybertruck production capacity to meet strong customer demand.',
          sentiment: 'positive',
          sentimentScore: 0.80,
          relevanceScore: 0.90,
          source: 'Reuters',
          publishedAt: now.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
          topics: ['Cybertruck', 'Production', 'Demand'],
          impact: 'high',
          aiAnalysis: {
            keyPoints: [
              'Production capacity increased by 30%',
              'Strong pre-order backlog maintained'
            ],
            marketImpact: 'Positive signal for delivery targets',
            tradingSignals: ['Volume expansion', 'Demand strength']
          }
        },
        {
          id: '2',
          title: 'EV Market Competition Intensifies',
          summary: 'Traditional automakers are launching new electric vehicles, increasing competition in the EV market.',
          sentiment: 'neutral',
          sentimentScore: 0.50,
          relevanceScore: 0.70,
          source: 'Wall Street Journal',
          publishedAt: yesterday.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
          topics: ['Competition', 'EV Market', 'Strategy'],
          impact: 'medium',
          aiAnalysis: {
            keyPoints: [
              'Traditional OEMs ramping up EV production',
              'Tesla maintains technology leadership'
            ],
            marketImpact: 'Competition risk offset by first-mover advantage',
            tradingSignals: ['Market share watch', 'Innovation focus']
          }
        },
        {
          id: '3',
          title: 'Tesla Expands Supercharger Network in Europe',
          summary: 'The company announced plans to add 500 new Supercharger stations across Europe in 2025.',
          sentiment: 'positive',
          sentimentScore: 0.75,
          relevanceScore: 0.85,
          source: 'Bloomberg',
          publishedAt: twoDaysAgo.toISOString(),
          url: 'https://finance.yahoo.com/news/tsla',
          topics: ['Infrastructure', 'Europe', 'Growth'],
          impact: 'medium',
          aiAnalysis: {
            keyPoints: [
              'European expansion accelerating',
              'Network advantage strengthened'
            ],
            marketImpact: 'Enhances competitive moat in Europe',
            tradingSignals: ['Geographic expansion', 'Long-term value']
          }
        },
      ],
      analytics: {
        overallSentiment: 'positive',
        sentimentScore: 72,
        totalArticles: 3,
        highImpactNews: 1,
        trendingTopics: ['Cybertruck', 'Production', 'Europe', 'Competition'],
        lastUpdated: now.toISOString(),
      }
    },
  };

  return mockNews[symbol] || {
    symbol,
    news: [
      {
        id: '1',
        title: `${symbol} Stock Analysis Update`,
        summary: `Recent market activity shows ${symbol} maintaining steady performance amid market volatility.`,
        sentiment: 'neutral',
        sentimentScore: 0.50,
        relevanceScore: 0.60,
        source: 'Market Watch',
        publishedAt: now.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
        topics: ['Market Analysis', 'Performance'],
        impact: 'low',
        aiAnalysis: {
          keyPoints: [
            'Stable trading range maintained',
            'No major catalysts identified'
          ],
          marketImpact: 'Neutral outlook pending new developments',
          tradingSignals: ['Range-bound', 'Watch for catalysts']
        }
      },
      {
        id: '2',
        title: `Analysts Update ${symbol} Price Targets`,
        summary: `Several Wall Street analysts have updated their price targets for ${symbol} following recent earnings.`,
        sentiment: 'neutral',
        sentimentScore: 0.55,
        relevanceScore: 0.70,
        source: 'Financial Times',
        publishedAt: yesterday.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
        topics: ['Analyst Ratings', 'Price Targets'],
        impact: 'medium',
        aiAnalysis: {
          keyPoints: [
            'Mixed analyst opinions observed',
            'Price target range widened'
          ],
          marketImpact: 'Reflects uncertainty in market consensus',
          tradingSignals: ['Mixed sentiment', 'Monitor earnings']
        }
      },
      {
        id: '3',
        title: `${symbol} Market Performance Review`,
        summary: `A comprehensive look at ${symbol}'s recent market performance and outlook for the coming quarter.`,
        sentiment: 'neutral',
        sentimentScore: 0.50,
        relevanceScore: 0.65,
        source: 'Bloomberg',
        publishedAt: twoDaysAgo.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
        topics: ['Performance Review', 'Outlook'],
        impact: 'low',
        aiAnalysis: {
          keyPoints: [
            'Quarter performance in line with sector',
            'Focus on upcoming guidance'
          ],
          marketImpact: 'Awaiting next earnings for direction',
          tradingSignals: ['Hold position', 'Earnings catalyst']
        }
      },
    ],
    analytics: {
      overallSentiment: 'neutral',
      sentimentScore: 50,
      totalArticles: 3,
      highImpactNews: 0,
      trendingTopics: ['Market Analysis', 'Earnings', 'Performance'],
      lastUpdated: now.toISOString(),
    }
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
