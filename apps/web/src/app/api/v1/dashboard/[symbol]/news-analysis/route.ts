import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsFromSerpApi, SerpApiNewsArticle } from '@/lib/serpapi-client';
import { summarizeNewsWithClaude, KeyPointWithSource } from '@/lib/claude-news-summarizer';

export const runtime = 'nodejs';

// Simple in-memory cache
interface CacheEntry {
  data: NewsAnalysisSummary;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface NewsArticleMetadata {
  title: string;
  link: string;
  source: string;
  date: string;
}

export interface NewsAnalysisSummary {
  symbol: string;
  summary: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number; // 0-100
    keyPoints: KeyPointWithSource[]; // 7-10 concise bullet points with source references
    trendingTopics: string[]; // Top 3-5 topics
    marketImpact: string; // Single sentence impact assessment
  };
  articles: NewsArticleMetadata[]; // Source articles for reference
  metadata: {
    articlesAnalyzed: number;
    timeRange: string; // "Past 7 days"
    lastUpdated: string; // ISO timestamp
  };
}

function getCachedResult(symbol: string): NewsAnalysisSummary | null {
  const entry = cache.get(symbol);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(symbol);
    return null;
  }

  return entry.data;
}

function setCachedResult(symbol: string, data: NewsAnalysisSummary): void {
  cache.set(symbol, {
    data,
    timestamp: Date.now()
  });

  // LRU eviction: keep max 100 symbols in cache
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
}

/**
 * Fetches news from SERPAPI and summarizes with Claude AI
 */
async function fetchNewsAnalysis(symbol: string): Promise<NewsAnalysisSummary> {
  // Check cache first
  const cached = getCachedResult(symbol);
  if (cached) {
    console.log(`🎯 Cache hit for news analysis ${symbol}`);
    return cached;
  }

  console.log(`🚀 Fetching fresh news analysis for ${symbol}`);

  try {
    // Step 1: Fetch news from SERPAPI (past 7 days, max 20 articles)
    const articles = await fetchNewsFromSerpApi(symbol, 7, 20);
    console.log(`📰 Fetched ${articles.length} articles for ${symbol}`);

    // Step 2: Summarize with Claude AI
    const aiSummary = await summarizeNewsWithClaude(symbol, articles);
    console.log(`🤖 Generated AI summary for ${symbol}`);

    // Step 3: Build response with article metadata
    const newsData: NewsAnalysisSummary = {
      symbol: symbol.toUpperCase(),
      summary: {
        overallSentiment: aiSummary.overallSentiment,
        sentimentScore: aiSummary.sentimentScore,
        keyPoints: aiSummary.keyPoints,
        trendingTopics: aiSummary.trendingTopics,
        marketImpact: aiSummary.marketImpact,
      },
      articles: articles.map((article) => ({
        title: article.title,
        link: article.link,
        source: article.source,
        date: article.date,
      })),
      metadata: {
        articlesAnalyzed: articles.length,
        timeRange: 'Past 7 days',
        lastUpdated: new Date().toISOString(),
      },
    };

    // Cache the result
    setCachedResult(symbol, newsData);

    return newsData;
  } catch (error) {
    console.error(`❌ Error fetching news analysis for ${symbol}:`, error);

    // Return fallback response on error
    const fallbackData: NewsAnalysisSummary = {
      symbol: symbol.toUpperCase(),
      summary: {
        overallSentiment: 'neutral',
        sentimentScore: 50,
        keyPoints: [
          { text: 'News analysis temporarily unavailable.', articleIndices: [] },
          { text: 'Please check back later for updated insights.', articleIndices: [] },
        ],
        trendingTopics: ['Service Unavailable'],
        marketImpact: 'Unable to assess market impact at this time.',
      },
      articles: [],
      metadata: {
        articlesAnalyzed: 0,
        timeRange: 'Past 7 days',
        lastUpdated: new Date().toISOString(),
      },
    };

    return fallbackData;
  }
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
